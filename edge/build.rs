//! Embeds dist/ into the wasm binary.
//!
//! Compressible assets get brotli and gzip variants baked in so requests
//! never compress at runtime. Clients that accept neither get the gzip
//! blob inflated in wasm at request time.

use anyhow::{bail, Context, Result};
use flate2::write::GzEncoder;
use flate2::Compression;
use std::env;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

const BROTLI_QUALITY: u32 = 11;
const BROTLI_WINDOW: u32 = 24;

// Same table as the old lighttpd mimetype.assign.
fn mime_of(path: &str) -> &'static str {
    let ext = path.rsplit('.').next().unwrap_or("");
    match ext {
        "html" => "text/html",
        "css" => "text/css",
        "js" | "mjs" => "text/javascript",
        "json" | "map" => "application/json",
        "xml" => "application/xml",
        "txt" => "text/plain",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "webmanifest" => "application/manifest+json",
        "avif" => "image/avif",
        _ => "application/octet-stream",
    }
}

// Same list as the old lighttpd deflate.mimetypes.
fn compressible(mime: &str) -> bool {
    matches!(
        mime,
        "text/html"
            | "text/plain"
            | "text/css"
            | "text/javascript"
            | "application/javascript"
            | "application/json"
            | "application/xml"
            | "image/svg+xml"
    )
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.is_dir() {
            walk(&path, out)?;
        } else if path.is_file() {
            out.push(path);
        }
    }
    Ok(())
}

fn main() -> Result<()> {
    let root = Path::new(&env!("CARGO_MANIFEST_DIR")).to_path_buf();
    let dist = env::var_os("MCX_DIST")
        .map(PathBuf::from)
        .unwrap_or_else(|| root.join("../dist"));
    let dist = dist.canonicalize().unwrap_or(dist);
    if !dist.is_dir() {
        bail!("{} not found; run `pnpm build` first", dist.display());
    }

    let out_dir = PathBuf::from(env::var_os("OUT_DIR").context("OUT_DIR unset")?);
    let blobs = out_dir.join("blobs");
    fs::create_dir_all(&blobs)?;

    println!("cargo:rerun-if-env-changed=MCX_DIST");
    println!("cargo:rerun-if-changed={}", dist.display());

    let mut files = Vec::new();
    walk(&dist, &mut files)?;
    let mut files: Vec<(String, PathBuf)> = files
        .into_iter()
        .map(|file| {
            let rel = format!(
                "/{}",
                file.strip_prefix(&dist)
                    .expect("walk stays under dist")
                    .to_string_lossy()
                    .replace('\\', "/")
            );
            (rel, file)
        })
        .collect();
    // Sort by URL path: the manifest is binary-searched on this key and the
    // byte order of "releases.json" vs "releases/" differs from PathBuf order.
    files.sort_by(|a, b| a.0.cmp(&b.0));

    let mut manifest = String::from(
        "pub struct Asset {\n\
         \x20   pub path: &'static str,\n\
         \x20   pub mime: &'static str,\n\
         \x20   pub len: usize,\n\
         \x20   pub br: Option<&'static [u8]>,\n\
         \x20   pub gzip: Option<&'static [u8]>,\n\
         \x20   pub raw: Option<&'static [u8]>,\n\
         }\n\
         pub static ASSETS: &[Asset] = &[\n",
    );

    for (i, (rel, file)) in files.iter().enumerate() {
        println!("cargo:rerun-if-changed={}", file.display());
        let mime = mime_of(rel);
        let data = fs::read(file)?;

        let mut br = "None".to_string();
        let mut gz = "None".to_string();
        let mut raw = format!("Some(include_bytes!({:?}) as &[u8])", file.display().to_string());

        if compressible(mime) && data.len() >= 128 {
            let br_path = blobs.join(format!("{i}.br"));
            let mut enc = brotli::CompressorWriter::new(
                fs::File::create(&br_path)?,
                4096,
                BROTLI_QUALITY,
                BROTLI_WINDOW,
            );
            enc.write_all(&data)?;
            drop(enc);

            let gz_path = blobs.join(format!("{i}.gz"));
            let mut enc = GzEncoder::new(Vec::new(), Compression::best());
            enc.write_all(&data)?;
            fs::write(&gz_path, enc.finish()?)?;

            br = format!(
                "Some(include_bytes!(concat!(env!(\"OUT_DIR\"), \"/blobs/{i}.br\")) as &[u8])"
            );
            gz = format!(
                "Some(include_bytes!(concat!(env!(\"OUT_DIR\"), \"/blobs/{i}.gz\")) as &[u8])"
            );
            raw = "None".to_string();
        }

        manifest.push_str(&format!(
            "    Asset {{ path: {rel:?}, mime: {mime:?}, len: {}, br: {br}, gzip: {gz}, raw: {raw} }},\n",
            data.len(),
        ));
    }
    manifest.push_str("];\n");
    fs::write(out_dir.join("manifest.rs"), manifest)?;
    Ok(())
}
