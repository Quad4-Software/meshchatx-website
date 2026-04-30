# MeshChatX website

Marketing site for [MeshChatX](https://git.quad4.io/RNS-Things/MeshChatX): [SvelteKit](https://kit.svelte.dev/) with [`@sveltejs/adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node). Pages are **server-rendered** (releases from Gitea/GitHub are fetched on the server with a short in-memory cache; `static/data/` snapshots are used if an API fails). `sitemap.xml` and `robots.txt` stay build-prerendered. Locales **en**, **de**, **ru**, **it** (strings in `i18n/`).

**PWA:** Installable web app via `@vite-pwa/sveltekit`. The service worker **does not cache HTML navigations or `/data/*`** (always network), so SSR pages and embedded release payloads stay fresh; static assets use a separate stale-while-revalidate cache.

## Requirements

- **Node.js** 24 or newer (see `package.json` `engines`)
- **pnpm** 10.33 or newer (`corepack enable pnpm` if you use Corepack)

## Install and build

From the repository root:

```bash
pnpm install
pnpm run build
```

Output is written to **`build/`** (run **`pnpm start`** / `node build` after `pnpm run build`; the Docker image runs this).

Useful scripts: `pnpm run dev` (Vite dev server), `pnpm run preview`, `pnpm run check` (svelte-check), `pnpm run lint`, `pnpm test`, **`pnpm run test:coverage`**. Snapshot files under **`static/data/`** (`releases-bundle.json`, `gitea-releases.json`) back the site when live APIs are unreachable; refresh them with **`pnpm run fetch:releases`** before shipping or from CI. Optional env **`RELEASES_CACHE_SECONDS`** (default 120, max 3600) tunes server-side release cache TTL.

### SEO and social

Pages ship with `title`, meta description, canonical and `hreflang` alternates, Open Graph and Twitter Card fields. The default social image URL is `https://meshchatx.com/logo.webp` (see `SITE_ORIGIN` in `src/lib/paths.ts` and `MetaTags.svelte`). **Sitemap:** `https://meshchatx.com/sitemap.xml` (generated at build time). **Robots:** `https://meshchatx.com/robots.txt`. **Security contact:** `https://meshchatx.com/.well-known/security.txt` (also `security.txt` in repo root for reference).

## Container image

Build a production image locally (multi-stage: Node builds the app, final stage runs **`node build`** only):

```bash
docker build -t meshchatx-website:latest .
```

With Podman:

```bash
podman build -t meshchatx-website:latest .
```

The container listens on **8080** (`PORT`, see `Dockerfile`). Quick local check after a build:

```bash
docker run --rm -p 8080:8080 meshchatx-website:latest
```

## Task runner

If you use [Task](https://taskfile.dev/), common tasks are defined in `Taskfile.yml` (for example `task build` runs `pnpm run build`, `task docker-build` runs `docker build`).