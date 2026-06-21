# MeshChatX website

[SvelteKit](https://kit.svelte.dev/) site with [`@sveltejs/adapter-node`](https://github.com/sveltejs/sveltekit/tree/main/packages/adapter-node). Product: [MeshChatX](https://github.com/Quad4-Software/MeshChatX).

## Requirements

- Node.js 24+ (`package.json` `engines`)
- pnpm 11+ (`corepack enable pnpm`)

## Install and build

```bash
pnpm install
pnpm run build
```

Artifacts: `build/`. Run locally: `pnpm start` (or `node build`). Dev: `pnpm run dev`.

## Environment

| Variable                 | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `GITHUB_TOKEN`           | Optional. Raises GitHub API rate limits for release metadata.     |
| `RELEASES_CACHE_SECONDS` | In-memory cache for release listing (default `300`, max `86400`). |

Release metadata is fetched live from [GitHub releases](https://github.com/Quad4-Software/MeshChatX/releases) (REST API, with Atom feed fallback). No manual sync or CDN configuration is required.

**GET `/api/mcx-releases`** returns the same JSON embedded in HTML (handy for `curl`). The download page requests it when the embed has no version (e.g. stale cached HTML).

## Deployment

Build and run the image (listens on **8080**; set `PORT` if needed):

```bash
docker build -t meshchatx-website:latest .
docker run --rm -p 8080:8080 meshchatx-website:latest
```

Podman: `podman build` / `podman run` with the same flags.
