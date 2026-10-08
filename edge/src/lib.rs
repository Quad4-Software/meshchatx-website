//! FastEdge app: serves the Astro build output baked into the wasm binary.

mod generated {
    include!(concat!(env!("OUT_DIR"), "/manifest.rs"));
}

pub use generated::{Asset, ASSETS};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Encoding {
    Brotli,
    Identity,
}

fn find(path: &str) -> Option<&'static Asset> {
    ASSETS
        .binary_search_by(|a| a.path.cmp(path))
        .ok()
        .map(|i| &ASSETS[i])
}

/// Percent-decodes a request path. Returns None on malformed escapes.
fn decode_path(raw: &str) -> Option<String> {
    if !raw.contains('%') {
        return Some(raw.to_string());
    }
    let bytes = raw.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            if i + 2 >= bytes.len() {
                return None;
            }
            let hi = (bytes[i + 1] as char).to_digit(16)?;
            let lo = (bytes[i + 2] as char).to_digit(16)?;
            out.push(((hi << 4) | lo) as u8);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}

/// Maps a request path to an embedded asset. Mirrors the old lighttpd rules:
/// exact file, then `index.html` under the directory, then a `.json` sibling
/// for `/api/*` routes that used to terminate on the site API service.
pub fn resolve(raw_path: &str) -> Option<&'static Asset> {
    let path = decode_path(raw_path)?;
    if !path.starts_with('/')
        || path
            .split('/')
            .any(|seg| seg == ".." || seg == "." || seg.contains('\\') || seg.contains('\0'))
    {
        return None;
    }
    if let Some(a) = find(&path) {
        return Some(a);
    }
    let index = if path.ends_with('/') {
        format!("{path}index.html")
    } else {
        format!("{path}/index.html")
    };
    if let Some(a) = find(&index) {
        return Some(a);
    }
    if path.starts_with("/api/")
        && !path.ends_with('/')
        && !path.rsplit('/').next().unwrap_or("").contains('.')
    {
        return find(&format!("{path}.json"));
    }
    None
}

/// Picks the response encoding from Accept-Encoding.
pub fn negotiate(accept_encoding: &str) -> Encoding {
    let accepted = accept_encoding.split(',').any(|token| {
        let mut parts = token.trim().splitn(2, ';');
        let name = parts.next().unwrap_or("").trim();
        if !(name.eq_ignore_ascii_case("br") || name == "*") {
            return false;
        }
        match parts.next() {
            Some(params) => !params.trim().starts_with("q=0"),
            None => true,
        }
    });
    if accepted {
        Encoding::Brotli
    } else {
        Encoding::Identity
    }
}

/// Bytes and Content-Encoding for one asset variant. Identity on a
/// compressed-only asset inflates the brotli blob at request time.
pub fn body_for(asset: &Asset, enc: Encoding) -> Option<(Vec<u8>, Option<&'static str>)> {
    match enc {
        Encoding::Brotli => {
            if let Some(br) = asset.br {
                return Some((br.to_vec(), Some("br")));
            }
        }
        Encoding::Identity => {
            if let Some(raw) = asset.raw {
                return Some((raw.to_vec(), None));
            }
        }
    }
    if let Some(raw) = asset.raw {
        return Some((raw.to_vec(), None));
    }
    asset.br.and_then(|br| inflate_brotli(br).map(|b| (b, None)))
}

fn inflate_brotli(br: &[u8]) -> Option<Vec<u8>> {
    use std::io::Read;
    let mut out = Vec::new();
    brotli::Decompressor::new(br, 4096)
        .read_to_end(&mut out)
        .ok()?;
    Some(out)
}

/// Variant length and Content-Encoding without copying the body, for HEAD.
/// Follows the same fallback order as body_for.
fn head_variant(asset: &Asset, enc: Encoding) -> Option<(usize, Option<&'static str>)> {
    match enc {
        Encoding::Brotli => {
            if let Some(br) = asset.br {
                return Some((br.len(), Some("br")));
            }
        }
        Encoding::Identity => {
            if let Some(raw) = asset.raw {
                return Some((raw.len(), None));
            }
        }
    }
    if let Some(raw) = asset.raw {
        return Some((raw.len(), None));
    }
    // Identity on a brotli-only asset inflates to the raw length.
    asset.br.map(|_| (asset.len, None))
}

/// Matches the old lighttpd expire rules.
pub fn cache_control(path: &str) -> &'static str {
    if path.starts_with("/_astro/") {
        "public, max-age=31536000, immutable"
    } else {
        "public, max-age=300"
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm_app {
    use super::*;
    use wstd::http::body::Body;
    use wstd::http::{Method, Request, Response, StatusCode};

    fn respond(
        status: StatusCode,
        asset: &Asset,
        enc: Encoding,
        head_only: bool,
    ) -> anyhow::Result<Response<Body>> {
        // HEAD resolves the variant length without materializing the body.
        let (body, content_encoding, body_len) = if head_only {
            let (len, ce) = head_variant(asset, enc)
                .ok_or_else(|| anyhow::anyhow!("no variant for {}", asset.path))?;
            (Vec::new(), ce, len)
        } else {
            let (bytes, ce) = body_for(asset, enc)
                .ok_or_else(|| anyhow::anyhow!("no variant for {}", asset.path))?;
            let len = bytes.len();
            (bytes, ce, len)
        };
        // The gateway rewrites cache-control to no-store; CDN-Cache-Control
        // passes through and still drives the CDN layer in front of the app.
        let cache = cache_control(asset.path);
        let mut b = Response::builder()
            .status(status)
            .header("content-type", asset.mime)
            .header("cache-control", cache)
            .header("cdn-cache-control", cache)
            .header("vary", "Accept-Encoding")
            .header("x-content-type-options", "nosniff")
            .header("referrer-policy", "no-referrer")
            .header("x-frame-options", "SAMEORIGIN");
        if let Some(ce) = content_encoding {
            b = b.header("content-encoding", ce);
        }
        if head_only {
            b = b.header("content-length", body_len.to_string());
        }
        Ok(b.body(Body::from(body))?)
    }

    #[wstd::http_server]
    async fn main(req: Request<Body>) -> anyhow::Result<Response<Body>> {
        let method = req.method().clone();
        if method != Method::GET && method != Method::HEAD {
            return Ok(Response::builder()
                .status(StatusCode::METHOD_NOT_ALLOWED)
                .header("allow", "GET, HEAD")
                .header("content-type", "text/plain")
                .body(Body::from("method not allowed\n"))?);
        }
        let ae = req
            .headers()
            .get("accept-encoding")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        let enc = negotiate(ae);
        let head_only = method == Method::HEAD;
        match resolve(req.uri().path()) {
            Some(asset) => respond(StatusCode::OK, asset, enc, head_only),
            None => match find("/404.html") {
                Some(asset) => respond(StatusCode::NOT_FOUND, asset, enc, head_only),
                None => Ok(Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .header("content-type", "text/plain")
                    .body(Body::from("not found\n"))?),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_index() {
        assert_eq!(resolve("/").map(|a| a.path), Some("/index.html"));
        assert_eq!(resolve("/download").map(|a| a.path), Some("/download/index.html"));
        assert_eq!(
            resolve("/download/").map(|a| a.path),
            Some("/download/index.html")
        );
    }

    #[test]
    fn resolves_files() {
        assert!(resolve("/index.html").is_some());
        assert!(resolve("/favicon.ico").is_some());
        assert!(resolve("/missing-page").is_none());
    }

    #[test]
    fn resolves_api_suffix() {
        assert_eq!(
            resolve("/api/releases").map(|a| a.path),
            Some("/api/releases.json")
        );
        assert_eq!(
            resolve("/api/releases/stable").map(|a| a.path),
            Some("/api/releases/stable.json")
        );
        assert_eq!(
            resolve("/api/interfaces").map(|a| a.path),
            Some("/api/interfaces.json")
        );
        assert!(resolve("/api/mcx-releases.json").is_some());
        assert!(resolve("/api/nope").is_none());
    }

    #[test]
    fn rejects_traversal() {
        assert!(resolve("/../Cargo.toml").is_none());
        assert!(resolve("/%2e%2e/secret").is_none());
        assert!(resolve("/docs/../index.html").is_none());
        assert!(resolve("noslash").is_none());
    }

    #[test]
    fn negotiates_encoding() {
        assert_eq!(negotiate("gzip, deflate, br, zstd"), Encoding::Brotli);
        assert_eq!(negotiate("br"), Encoding::Brotli);
        assert_eq!(negotiate("gzip, deflate"), Encoding::Identity);
        assert_eq!(negotiate(""), Encoding::Identity);
        assert_eq!(negotiate("br;q=0, gzip"), Encoding::Identity);
        assert_eq!(negotiate("*"), Encoding::Brotli);
    }

    #[test]
    fn every_asset_has_a_body() {
        for a in ASSETS {
            assert!(a.raw.is_some() || a.br.is_some(), "{} has no body", a.path);
            for enc in [Encoding::Brotli, Encoding::Identity] {
                let (body, ce) = body_for(a, enc).unwrap_or_else(|| {
                    panic!("{} has no {enc:?} body", a.path);
                });
                if enc == Encoding::Identity {
                    assert_eq!(body.len(), a.len, "{}", a.path);
                    assert!(ce.is_none());
                }
            }
        }
    }
}
