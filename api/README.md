# MeshChatX site API

Echo service that proxies the live data the static site renders so pages can
refresh without a rebuild: GitHub releases, the RNS interface directory, the
repo changelog, and the roadmap.

## Run

```sh
go run ./cmd/server            # listens on :8090
docker build -t siteapi -f api/Dockerfile .
```

## Endpoints

- `GET /healthz`
- `GET /api/releases` and `GET /api/releases/{stable|beta|testing}`
- `GET /api/interfaces`
- `GET /api/changelog`
- `GET /api/roadmap`

## Config (env)

`ADDR`, `GITHUB_REPO`, `CDN_BASE`, `DIRECTORY_URL`, `CHANGELOG_URL`,
`ROADMAP_URL`, `PREFER_CDN`, `TTL_RELEASES`, `TTL_INTERFACES`,
`TTL_CHANGELOG`, `TTL_ROADMAP`.

## Notes

- TTL cache with singleflight: one upstream fetch per key at a time, and
  stale data is served when upstreams error.
- ETag + Cache-Control on every payload.
- CORS allows meshchatx.com plus localhost ports for local previews.
- Roadmap falls back to an embedded `roadmap.json` when `ROADMAP_URL` is
  unset or the URL fails.
