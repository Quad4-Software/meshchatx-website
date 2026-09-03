# MeshChatX website

Guidelines for agents in this repository.

## Project

Public marketing site for MeshChatX.

Stack: Laravel 13, Blade, Tailwind CSS 4, Vite, pnpm 11. Requires PHP 8.5.

### Routes

| Surface | Route(s) |
| --- | --- |
| Home | `/`, `/{locale}` |
| Docs | `/docs`, `/docs/{slug}` |
| Download | `/download` |
| Roadmap | `/roadmap` |
| Interfaces | `/interfaces` |
| Dependencies | `/dependency` |
| Branding | `/branding` |
| Contact | `/contact` |
| Donate | `/donate` |
| License | `/license` |
| Privacy | `/privacy` |
| Git | `/git` |
| Sitemap | `/sitemap.xml` |
| robots.txt | `/robots.txt` |
| llms.txt | `/llms.txt`, `/llms-full.txt`, `/docs/llms.txt` |
| Docs markdown | `/docs/{slug}.md`, `/docs/export-all/md` |
| Releases API | `/api/mcx-releases` |
| Interfaces API | `/api/mcx-interfaces` |
| SBOM API | `/api/mcx-sbom`, `/api/mcx-sbom/{version}` |

Download assets prefer Bunny CDN when `BUNNY_STORAGE_ACCESS_KEY` is set; GitHub Releases is the fallback.

Locales: English has no prefix. Prefixed: `de`, `es`, `fi`, `fr`, `it`, `nl`, `ru`, `zh`.

### Layout

- Controllers: `app/Http/Controllers` (thin, invokable)
- Constants and URLs: `config/meshchatx.php`
- Translations: `lang/*.json` (merged with `*.download.json`)
- Docs markdown: `content/docs/{locale}/` (falls back to `en`, synced from MeshChatX app `docs/`)
- Docs nav: `config/meshchatx/documentation.php`
- Docs search: vendored Fuse.js at `resources/js/vendor/fuse.mjs`
- Views: `resources/views/pages`, `resources/views/components`
- CSS: `resources/css/app.css`
- Routes: `routes/web.php`

## Skills

Read these before writing prose or changing product copy:

| Skill | Path |
| --- | --- |
| No AI slop | `.agents/skills/no-ai-slop/SKILL.md` |
| Voice profile | `.agents/skills/rossmann-voice/SKILL.md` |
| MeshChatX site | `.agents/skills/meshchatx/SKILL.md` |
| Reticulum | `.agents/skills/reticulum/SKILL.md` |
| Zen of Reticulum | `.agents/skills/reticulum-zen/SKILL.md` |
| rngit | `.agents/skills/rngit/SKILL.md` |

Banned-word reference: `.agents/skills/no-ai-slop/references/ai-writing-detection.md`.

Upstream anti-slop package: [no_ai_slop_writing_rules](https://github.com/realrossmanngroup/no_ai_slop_writing_rules).

## Checks

```bash
composer format && composer lint && composer test
pnpm run lint && pnpm run build
pnpm run lighthouse
```

Lighthouse thresholds live in `lighthouserc.cjs`. Remove `public/hot` before runs so Vite HMR does not poison production asset URLs.

## Design

Light-first zinc neutrals. Accent `#2563eb`. Outfit for UI and display. Icons from `@mdi/font`. No glow, no purple neon, no cream and terracotta pairing.

## Code changes

- Keep controllers thin. Put content in `config/meshchatx.php` and `lang/`.
- Run `composer lint` and `composer test` after PHP changes.
- Run `pnpm run lint` and `pnpm run build` after frontend changes.
- Do not commit `.env`, credentials, or artifacts listed in `.gitignore`.
