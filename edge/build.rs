//! Embeds dist/ into the wasm binary.
//!
//! Compressible assets are baked as a single brotli blob each; identical
//! files share one blob. Clients that do not accept brotli get the blob
//! inflated in wasm at request time.

use anyhow::{bail, Context, Result};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
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
         \x20   pub raw: Option<&'static [u8]>,\n\
         }\n\
         pub static ASSETS: &[Asset] = &[\n",
    );

    // (len, content hash) -> blob indices, so identical files embed once.
    // Blob N lives at blobs/N.bin (raw) and optionally blobs/N.br.
    let mut seen: HashMap<(usize, u64), Vec<usize>> = HashMap::new();
    let mut contents: Vec<Vec<u8>> = Vec::new();
    let mut wrote_raw: Vec<bool> = Vec::new();
    let mut wrote_br: Vec<bool> = Vec::new();

    for (rel, file) in &files {
        println!("cargo:rerun-if-changed={}", file.display());
        let mime = mime_of(rel);
        let data = fs::read(file)?;

        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        let key = (data.len(), hasher.finish());
        let blob_idx = seen
            .get(&key)
            .and_then(|ids| ids.iter().copied().find(|&i| contents[i] == data))
            .unwrap_or_else(|| {
                let i = contents.len();
                seen.entry(key).or_default().push(i);
                contents.push(data.clone());
                wrote_raw.push(false);
                wrote_br.push(false);
                i
            });

        let mut br = "None".to_string();
        let mut raw = "None".to_string();
        if compressible(mime) && data.len() >= 128 {
            if !wrote_br[blob_idx] {
                let mut enc = brotli::CompressorWriter::new(
                    fs::File::create(blobs.join(format!("{blob_idx}.br")))?,
                    4096,
                    BROTLI_QUALITY,
                    BROTLI_WINDOW,
                );
                enc.write_all(&data)?;
                drop(enc);
                wrote_br[blob_idx] = true;
            }
            br = format!(
                "Some(include_bytes!(concat!(env!(\"OUT_DIR\"), \"/blobs/{blob_idx}.br\")) as &[u8])"
            );
        } else {
            if !wrote_raw[blob_idx] {
                fs::write(blobs.join(format!("{blob_idx}.bin")), &data)?;
                wrote_raw[blob_idx] = true;
            }
            raw = format!(
                "Some(include_bytes!(concat!(env!(\"OUT_DIR\"), \"/blobs/{blob_idx}.bin\")) as &[u8])"
            );
        }

        manifest.push_str(&format!(
            "    Asset {{ path: {rel:?}, mime: {mime:?}, len: {}, br: {br}, raw: {raw} }},\n",
            data.len(),
        ));
    }
    manifest.push_str("];\n");
    fs::write(out_dir.join("manifest.rs"), manifest)?;
    Ok(())
}
