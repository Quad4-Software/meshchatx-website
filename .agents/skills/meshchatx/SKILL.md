---
name: meshchatx
description: "Facts and URLs for the MeshChatX product and this marketing site. Use when editing pages, config, copy, downloads, git mirrors, or release wiring."
---

# MeshChatX

MeshChatX is an all-in-one Reticulum client (messaging, calls, NomadNet browser, and related tools). This repository is only the public marketing website at meshchatx.com, not the application source tree.

Application repo: https://github.com/Quad4-Software/MeshChatX

Canonical source of truth for site URLs and nav lives in `config/meshchatx.php`. Prefer editing that file over hardcoding strings in Blade.

## This website

- Stack: Laravel 13, Blade, Tailwind CSS 4, Vite, pnpm 11, PHP 8.5
- Locales: `en` (no prefix), `de`, `ru`, `it`, `zh`
- Release assets are pulled from GitHub Releases and cached (`RELEASES_CACHE_SECONDS`, default 3600)
- Reticulum interface directory is copied from directory.rns.recipes and cached (`RNS_DIRECTORY_CACHE_SECONDS`, default 259200 / 72 hours)
- Privacy stance on the site: no tracking, no ads, functional cookies only (`mcx_locale`)

## Product URLs (from config)

| Key | Value |
| --- | --- |
| Domain | `https://meshchatx.com` (`MESHCHATX_DOMAIN`) |
| GitHub | `https://github.com/Quad4-Software/MeshChatX` |
| Releases | `https://github.com/Quad4-Software/MeshChatX/releases` |
| Changelog | `https://github.com/Quad4-Software/MeshChatX/blob/master/CHANGELOG.md` |
| PyPI | `https://pypi.org/project/reticulum-meshchatx/` (package `reticulum-meshchatx`) |
| Docker Hub | `quad4io/meshchatx:latest` |
| App GHCR | `ghcr.io/quad4-software/meshchatx:latest` |
| Umbrel | `https://apps.umbrel.com/app/meshchatx` |
| Forum | `https://forum.meshchatx.com/` |
| Interface directory | `https://directory.rns.recipes/` |
| LavaForge mirror | `https://lavaforge.org/Reticulum-Things/MeshChatX` |
| Quad4 | `https://quad4.io/` |
| Crypto docs | `https://reticulum.network/crypto.html` |

## Contact and donate

- LXMF: `f489752fbef161c64d65e385a4e9fc74`
- Email: `team@quad4.io`
- Ko-fi: `https://ko-fi.com/quad4`
- Buy Me a Coffee: `https://buymeacoffee.com/quad4`
- Monero address: see `config/meshchatx.php` `donate.xmr`

## Git mirrors on `/git`

rngit over Reticulum is the canonical tree. GitHub and LavaForge are clearnet mirrors for CI and releases.

- Clone:

```text
git clone rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX
```

- NomadNet page:

```text
132f67e79d9b24aad014e93015fb858f:/page/repo.mu`g=public|r=MeshChatX
```

- No clearnet rngit HTTP endpoint. Do not invent one.

## Copy rules for this product

- MeshChatX does not operate central message servers. Traffic goes over Reticulum links the user configures.
- Do not invent release dates, version numbers, or download filenames. Prefer live release data or language already in `lang/`.
- When describing cryptography, point at Reticulum's published primitives rather than claiming MeshChatX invented them.
- Read `.agents/skills/no-ai-slop/SKILL.md` before writing or rewriting marketing prose.
