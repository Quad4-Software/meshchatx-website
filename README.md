# MeshChatX website

Marketing site for [MeshChatX](https://github.com/Quad4-Software/MeshChatX): [SvelteKit](https://kit.svelte.dev/) with [`@sveltejs/adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node). Pages are **server-rendered**. Download links and the home version badge use **[bunny.net Edge Storage](https://docs.bunny.net/api-reference/storage/browse-files/list-files)** (list API) under your storage zone (default layout: `/{versionsPrefix}/{version}/win/`, `mac/`, etc.). Public file URLs use **`BUNNY_PUBLIC_BASE_URL`** (defaults to **`https://meshchatx.b-cdn.net`** Pull Zone; override for staging or another CDN). GitHub remains linked as a fallback. `sitemap.xml` and `robots.txt` stay build-prerendered. Locales **en**, **de**, **ru**, **it**, **zh** (strings in `i18n/`).

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

Useful scripts: `pnpm run dev` (Vite dev server), `pnpm run preview`, `pnpm run check` (svelte-check), `pnpm run lint`, `pnpm test`, **`pnpm run test:coverage`**.

**Releases (server):** Set **`BUNNY_STORAGE_ACCESS_KEY`** (read-only storage password; header `AccessKey`). Defaults: **`BUNNY_STORAGE_HOST`** `la.storage.bunnycdn.com`, **`BUNNY_STORAGE_ZONE`** `meshchatx`, **`BUNNY_VERSIONS_PREFIX`** `master` (lists `/{zone}/{prefix}/` for version directories). **`BUNNY_PUBLIC_BASE_URL`**: base URL for browser download links (defaults to **`https://meshchatx.b-cdn.net`**; set explicitly to another origin, e.g. `https://la.storage.bunnycdn.com/meshchatx`, if you need raw storage instead of the Pull Zone). **`RELEASES_CACHE_SECONDS`**: in-memory cache TTL (default **300**, max **86400**). Without `BUNNY_STORAGE_ACCESS_KEY`, download metadata is empty and the UI points users to GitHub.

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
