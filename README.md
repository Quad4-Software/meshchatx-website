# MeshChatX website

Public marketing site for [MeshChatX](https://github.com/Quad4-Software/MeshChatX).

Stack: PHP 8.5, Laravel 13, Blade, Vite 8, Tailwind CSS 4, pnpm 11.

Locales: `en` (unprefixed), `de`, `es`, `fi`, `fr`, `it`, `nl`, `ru`, `zh`.

## Setup

```bash
composer setup
```

Or:

```bash
composer install
cp .env.example .env
php artisan key:generate
pnpm install --frozen-lockfile
pnpm run build
```

Dev server:

```bash
composer dev
```

## Layout

| Path | Role |
| --- | --- |
| `config/meshchatx.php` | URLs, nav, SEO inputs |
| `config/meshchatx/roadmap.php` | Roadmap versions |
| `config/meshchatx/documentation.php` | Docs sidebar groups and slugs |
| `content/docs/` | Markdown docs (`en/` with locale fallback) |
| `lang/` | Translations |
| `resources/views/pages/` | Page templates |
| `resources/css/app.css` | Theme and components |
| `routes/web.php` | Public routes |

## Checks

```bash
composer format && composer lint && composer test
pnpm run lint && pnpm run build
pnpm run lighthouse
```

Lighthouse CI uses `lighthouserc.cjs` (desktop, performance ≥ 0.9, accessibility/SEO ≥ 0.95, best-practices ≥ 0.9).

## Docker

Local (default host port `8090` from `.env.docker`):

```bash
cp .env.docker.example .env.docker
# set APP_KEY (php artisan key:generate --show) then:
docker compose --env-file .env.docker up --build -d
```

Coolify: use `docker-compose.coolify.yml`. Do not publish host ports. Assign the domain only to the `web` service as `https://your.domain:8080` (not `app`). Set `APP_KEY` in Coolify env vars.

The app entrypoint clears and rebuilds config, route, and view caches. Named rate limiters for `/api/mcx-*` and docs export are registered in `AppServiceProvider::boot` so they still load under `route:cache`.

GHCR images (CI): `ghcr.io/quad4-software/meshchatx-website/app` and `.../web`.

## Public JSON APIs

| Path | Payload |
| --- | --- |
| `/api/mcx-releases` | Download assets by channel |
| `/api/mcx-interfaces` | Cached Reticulum interface directory |
| `/api/mcx-sbom`, `/api/mcx-sbom/{version}` | CycloneDX catalog and version SBOM |

Throttles: `mcx-api` 90/min, `mcx-sbom` 30/min (version route), `mcx-docs-export` 6/min for `/docs/export-all/*`.

## Env

| Variable | Purpose |
| --- | --- |
| `APP_KEY` | Required at runtime |
| `MESHCHATX_DOMAIN` | Canonical origin (default `https://meshchatx.com`) |
| `RELEASES_CACHE_SECONDS` | GitHub release cache TTL (default `3600`) |
| `RNS_DIRECTORY_CACHE_SECONDS` | Interface directory cache TTL (default `259200`) |
| `SBOM_CACHE_SECONDS` | SBOM cache TTL (default `2592000`) |
| `GITHUB_TOKEN` | Optional GitHub API rate limit |

## Agents

Project agent skills live under `.agents/skills/` (anti-slop writing rules plus MeshChatX / Reticulum / rngit context). See `AGENTS.md`.

## License

0BSD. See `LICENSE`.
