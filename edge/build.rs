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
use std::process::Command;

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

fn git(root: &Path, args: &[&str]) -> Option<String> {
    let out = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .ok()?;
    out.status
        .success()
        .then(|| String::from_utf8_lossy(&out.stdout).into_owned())
}

/// public/ paths whose committed blob hash matches the working tree file.
/// Those get a redirect to jsDelivr instead of an embedded copy.
fn mirrored_public(root: &Path) -> HashMap<String, String> {
    let mut out = HashMap::new();
    let Some(listing) = git(root, &["ls-files", "-s", "-z", "public"]) else {
        return out;
    };
    for entry in listing.split('\0').filter(|s| !s.is_empty()) {
        let (meta, path) = match entry.split_once('\t') {
            Some(v) => v,
            None => continue,
        };
        let blob = meta.split_whitespace().nth(1).unwrap_or("");
        if !blob.is_empty() {
            out.insert(path.to_string(), blob.to_string());
        }
    }
    out
}

fn hash_object(root: &Path, file: &Path) -> Option<String> {
    git(root, &["hash-object", &file.to_string_lossy()])
        .map(|s| s.trim().to_string())
}

/// Repo root for a crate dir; None outside a checkout.
fn repo_root(root: &Path) -> Option<PathBuf> {
    git(root, &["rev-parse", "--show-toplevel"])
        .map(|s| PathBuf::from(s.trim()))
        .filter(|p| p.is_dir())
}

const CDN_MIRROR: &str = "https://cdn.jsdelivr.net/gh/Quad4-Software/meshchatx-website";
// Below this a redirect hop costs more than the bytes saved.
const REDIRECT_MIN: usize = 4096;

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

    let repo = repo_root(&root);
    let git_sha = repo
        .as_ref()
        .and_then(|r| git(r, &["rev-parse", "HEAD"]))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let tracked = repo
        .as_ref()
        .map(|r| mirrored_public(r))
        .unwrap_or_default();

    let mut manifest = String::from(
        "pub struct Asset {\n\
         \x20   pub path: &'static str,\n\
         \x20   pub mime: &'static str,\n\
         \x20   pub len: usize,\n\
         \x20   pub br: Option<&'static [u8]>,\n\
         \x20   pub raw: Option<&'static [u8]>,\n\
         \x20   pub redirect: Option<&'static str>,\n\
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

        // Repo-committed media are served from jsDelivr via redirect. The
        // blob hash check keeps modified-but-uncommitted files embedded.
        let mut redirect = "None".to_string();
        if let Some(sha) = &git_sha {
            let repo_path = format!("public{rel}");
            if !compressible(mime)
                && data.len() >= REDIRECT_MIN
                && tracked.get(&repo_path).is_some_and(|blob| {
                    repo.as_ref()
                        .and_then(|r| hash_object(r, file))
                        .as_deref()
                        == Some(blob.as_str())
                })
            {
                redirect = format!(
                    "Some(concat!(\"{CDN_MIRROR}@{sha}\", \"/public{rel}\"))"
                );
            }
        }

        let mut br = "None".to_string();
        let mut raw = "None".to_string();
        if redirect != "None" {
            // offloaded, nothing to embed
        } else if compressible(mime) && data.len() >= 128 {
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
            "    Asset {{ path: {rel:?}, mime: {mime:?}, len: {}, br: {br}, raw: {raw}, redirect: {redirect} }},\n",
            data.len(),
        ));
    }
    manifest.push_str("];\n");
    fs::write(out_dir.join("manifest.rs"), manifest)?;
    Ok(())
}
