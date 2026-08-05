# MeshChatX website

Public marketing site for [MeshChatX](https://github.com/Quad4-Software/MeshChatX).

Stack: PHP 8.5, Laravel 13, Blade, Vite 8, Tailwind CSS 4, pnpm 11.

Locales: `en` (unprefixed), `de`, `ru`, `it`, `zh`.

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

Coolify: use `docker-compose.coolify.yml`. Do not publish host ports. Point the proxy at `web:8080`.

GHCR images (CI): `ghcr.io/quad4-software/meshchatx-website/app` and `.../web`.

## Env

| Variable | Purpose |
| --- | --- |
| `APP_KEY` | Required at runtime |
| `MESHCHATX_DOMAIN` | Canonical origin (default `https://meshchatx.com`) |
| `RELEASES_CACHE_SECONDS` | GitHub release cache TTL (default `3600`) |
| `GITHUB_TOKEN` | Optional GitHub API rate limit |

## Agents

Project agent skills live under `.agents/skills/` (anti-slop writing rules plus MeshChatX / Reticulum / rngit context). See `AGENTS.md`.

## License

0BSD. See `LICENSE`.
