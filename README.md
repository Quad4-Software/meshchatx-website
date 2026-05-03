# MeshChatX website

[SvelteKit](https://kit.svelte.dev/) site with [`@sveltejs/adapter-node`](https://github.com/sveltejs/sveltekit/tree/main/packages/adapter-node). Product: [MeshChatX](https://github.com/Quad4-Software/MeshChatX).

## Requirements

- Node.js 24+ (`package.json` `engines`)
- pnpm 10.33+ (`corepack enable pnpm`)

## Install and build

```bash
pnpm install
pnpm run build
```

Artifacts: `build/`. Run locally: `pnpm start` (or `node build`). Dev: `pnpm run dev`.

## Environment

| Variable | Description |
|----------|-------------|
| `BUNNY_STORAGE_ACCESS_KEY` | Storage zone password (HTTP header `AccessKey`). Required for download metadata from Bunny; if unset, the UI falls back to GitHub only. |
| `BUNNY_STORAGE_HOST` | Default `la.storage.bunnycdn.com`. |
| `BUNNY_STORAGE_ZONE` | Default `meshchatx`. |
| `BUNNY_VERSIONS_PREFIX` | Default `master`. If that path has no version-like subfolders, the server also tries `dev`, `release`, zone root, then other zone-level directories. |
| `BUNNY_PUBLIC_BASE_URL` | Base URL for asset links in the browser. Default `https://meshchatx.b-cdn.net`. Override for another CDN or raw storage origin. |
| `RELEASES_CACHE_SECONDS` | In-memory cache for release listing (default `300`, max `86400`). |

## Deployment

Build and run the image (listens on **8080**; set `PORT` if needed):

```bash
docker build -t meshchatx-website:latest .
docker run --rm -p 8080:8080 -e BUNNY_STORAGE_ACCESS_KEY=… meshchatx-website:latest
```

Podman: `podman build` / `podman run` with the same flags.

Pass the Bunny variables at runtime (`-e` / compose / your orchestrator). Defaults are baked into the `Dockerfile` except `BUNNY_STORAGE_ACCESS_KEY`, which you must supply in production.
