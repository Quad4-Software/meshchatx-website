# MeshChatX website

Marketing site for [MeshChatX](https://git.quad4.io/RNS-Things/MeshChatX): [SvelteKit](https://kit.svelte.dev/) with [`@sveltejs/adapter-static`](https://github.com/sveltejs/kit/tree/main/packages/adapter-static), prerendered HTML under `build/`, locales **en**, **de**, **ru**, **it** (strings in `i18n/`).

## Requirements

- **Node.js** 24 or newer (see `package.json` `engines`)
- **pnpm** 10.33 or newer (`corepack enable pnpm` if you use Corepack)

## Install and build

From the repository root:

```bash
pnpm install
pnpm run build
```

Output is written to **`build/`** (nginx and the Docker image expect that directory).

Useful scripts: `pnpm run dev` (Vite dev server), `pnpm run preview` (serve last `build/`), `pnpm run check` (svelte-check), `pnpm run lint`, `pnpm test`. Release data for the download page is snapshotted in `static/data/gitea-releases.json`; refresh it with `pnpm run fetch:releases` when you publish new GitHub/Gitea releases (runs on your machine, not in the browser).

### SEO and social

Pages ship with `title`, meta description, canonical and `hreflang` alternates, Open Graph and Twitter Card fields. The default social image URL is `https://meshchatx.com/logo.webp` (see `SITE_ORIGIN` in `src/lib/paths.ts` and `MetaTags.svelte`). **Sitemap:** `https://meshchatx.com/sitemap.xml` (generated at build time). **Robots:** `https://meshchatx.com/robots.txt`. **Security contact:** `https://meshchatx.com/.well-known/security.txt` (also `security.txt` in repo root for reference).

## Container image

Build a production image (multi-stage: Node runs `pnpm run build`, then static files are copied into **nginx unprivileged**):

```bash
docker build -t meshchatx-website:latest .
```

With Podman:

```bash
podman build -t meshchatx-website:latest .
```

The container listens on **8080** (see `Dockerfile` / `docker/nginx.default.conf`). Quick local check after a build:

```bash
docker run --rm -p 8080:8080 meshchatx-website:latest
```

Then open `http://127.0.0.1:8080/`. Optional orchestration and Traefik labels live in `docker-compose.yml`.

## Task runner

If you use [Task](https://taskfile.dev/), common tasks are defined in `Taskfile.yml` (for example `task build` runs `pnpm run build`, `task docker-build` runs `docker build`).