# MeshChatX website (Astro)

Static marketing + docs site for meshchatx.com. Rebuild of the Laravel site on
Astro 7, TypeScript strictest, Tailwind 4, zero-JS-by-default.

## Commands

```sh
pnpm dev          # dev server
pnpm build        # static build to dist/ (fetches GitHub/directory data)
pnpm preview      # serve dist/
pnpm check        # astro check + tsc --noEmit
pnpm lhci         # lighthouse autorun against dist/ (needs CHROME_PATH=/usr/bin/chromium)
```

Lighthouse must stay at 100 in every category; thresholds live in
`lighthouserc.json`.

## Layout

- `src/config/site.ts` - every constant: URLs, locales, nav, docs groups
- `src/config/roadmap.ts` - roadmap milestones
- `src/i18n/` - locale catalogs copied from the Laravel lang files, `t()` helper
- `src/lib/` - build-time data: `releases.ts` (GitHub + CDN probe),
  `changelog.ts`, `interfaces.ts`, `docs.ts`
- `src/content/docs/<locale>/` - markdown docs (en only so far)
- `src/pages/[...locale]/` - one route file per page; `locale` param is
  undefined for en, `de|es|fi|fr|it|nl|ru|zh` for the rest
- `src/pages/api/` - static JSON endpoints baked at build
- `src/components/` - Nav, Footer, Starfield, MeshGlyph, PageHero, CommandBlock, Icon
- `public/` - favicons, og cards, showcase shots, branding media

## Rules

- No runtime server. Everything is prerendered; external data (GitHub
  releases, interface directory, changelog) is fetched at build time.
- Copy lives in `src/i18n/locales/*.json`, not in components.
- New page: add `src/pages/[...locale]/<name>.astro` with the standard
  `getStaticPaths` over `LOCALES`, add nav/footer keys to `site.ts` and the
  catalogs, add an og card under `public/og/`.
- Plain ASCII in source copy: no em/en dashes, no curly quotes, no emoji, no
  unicode arrows, no semicolons in prose.
- The palette is the quad4 void scale (`--color-void-*`, `--color-paper-*`,
  `--color-mist-*`). Monochrome accent: paper on void, void on paper. No neon.
- Fonts are vendored via fontsource (Space Grotesk Variable, Space Mono). No
  remote assets.
- Theme is `data-theme` on `<html>` plus `localStorage('mcx-theme')`, default
  dark.
- Verify with `pnpm check && pnpm build` before committing.
