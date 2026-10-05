# MeshChatX site API

Echo service that proxies the live data the static site renders so pages can
refresh without a rebuild: GitHub releases, the RNS interface directory, the
repo changelog, and the roadmap.

## Run

```sh
go run ./cmd/server            # listens on :8090
docker build -t siteapi -f api/Dockerfile api
```

GHCR: `ghcr.io/quad4-software/meshchatx-website/api`.

## Endpoints

- `GET /healthz`
- `GET /api/releases` and `GET /api/releases/{stable|beta|testing}`
- `GET /api/interfaces`
- `GET /api/changelog`
- `GET /api/roadmap`
- `GET /api/torrents/{tag}`: generated .torrent for a release (202 while
  building, 302 to the upstream asset when the release ships one)

## Config (env)

`ADDR`, `GITHUB_REPO`, `CDN_BASE`, `PUBLIC_BASE`, `DIRECTORY_URL`,
`CHANGELOG_URL`, `ROADMAP_URL`, `PREFER_CDN`, `BUNNY_STORAGE_ACCESS_KEY`,
`BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_ENDPOINT`, `TTL_RELEASES`,
`TTL_INTERFACES`, `TTL_CHANGELOG`, `TTL_ROADMAP`.

When `BUNNY_STORAGE_ACCESS_KEY` is set the API lists that Storage zone and
rewrites matching GitHub assets to `CDN_BASE` URLs (GitHub stays as fallback).
Without the key it HEAD-probes `CDN_BASE/<track>/<tag>/<file>`.

## Notes

- TTL cache with singleflight: one upstream fetch per key at a time, and
  stale data is served when upstreams error.
- ETag + Cache-Control on every payload.
- CORS allows meshchatx.com plus localhost ports for local previews.
- Roadmap falls back to an embedded `roadmap.json` when `ROADMAP_URL` is
  unset or the URL fails.
- For the newest release of each channel the API builds a webseeded
  .torrent in the background (CDN + GitHub URL seeds, streamed piece
  hashing) and attaches it to the releases payload as
  `downloads.torrent` with a `magnet` URI once ready.
