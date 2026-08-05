# MeshChatX website

Guidelines for agents in this repository.

## Project

Public marketing site for MeshChatX.

Stack: Laravel 13, Blade, Tailwind CSS 4, Vite, pnpm 11. Requires PHP 8.5.

### Routes

| Surface | Route(s) |
| --- | --- |
| Home | `/`, `/{locale}` |
| Download | `/download` |
| Roadmap | `/roadmap` |
| Branding | `/branding` |
| Contact | `/contact` |
| Donate | `/donate` |
| License | `/license` |
| Privacy | `/privacy` |
| Git | `/git` |
| Sitemap | `/sitemap.xml` |
| Releases API | `/api/mcx-releases` |

Locales: English has no prefix. Prefixed: `de`, `ru`, `it`, `zh`.

### Layout

- Controllers: `app/Http/Controllers` (thin, invokable)
- Constants and URLs: `config/meshchatx.php`
- Translations: `lang/*.json` (merged with `*.download.json`)
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

## Commands

```bash
composer install
pnpm install --frozen-lockfile
pnpm run build
composer format
pnpm run format
composer lint
pnpm run lint
composer test
composer dev
```

## Design

Light-first zinc neutrals. Accent `#2563eb`. Outfit for UI and display. Icons from `@mdi/font`. No glow, no purple neon, no cream and terracotta pairing.

## Code changes

- Keep controllers thin. Put content in `config/meshchatx.php` and `lang/`.
- Run `composer lint` and `composer test` after PHP changes.
- Run `pnpm run lint` and `pnpm run build` after frontend changes.
- Do not commit `.env`, credentials, or artifacts listed in `.gitignore`.
