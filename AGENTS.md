# MeshChatX website (Astro)

Static marketing + docs site for meshchatx.com, served from a Rust wasm
binary on Gcore FastEdge. Astro 7, TypeScript strictest, Tailwind 4,
zero-JS-by-default.

## Commands

```sh
pnpm dev          # dev server
pnpm build        # static build to dist/ (fetches GitHub/directory data)
pnpm preview      # serve dist/
pnpm check        # astro check + tsc --noEmit
pnpm lhci         # lighthouse autorun against dist/ (needs CHROME_PATH=/usr/bin/chromium)
pnpm edge         # compile edge/ to wasm32-wasip2 (needs dist/)
pnpm build:edge   # astro build + wasm in one step
pnpm deploy       # scripts/deploy-fastedge.sh (needs GCORE_API_KEY, GCORE_APP_ID)
```

## Deploy

`edge/build.rs` embeds all of dist/ into the wasm binary: compressible
assets (html, css, js, json, xml, txt, svg) ship as brotli + gzip blobs
selected off Accept-Encoding at request time; the rest is embedded raw.
`wasmtime serve edge/target/wasm32-wasip2/release/meshchatx_edge.wasm`
runs it locally.

Deploy is `pnpm deploy`, which POSTs the binary to the FastEdge API and
PATCHes `GCORE_APP_ID` onto it. The app is created once in the Gcore
portal; point the site domain at its fastedge URL there.

The old site API (releases, interfaces refresh endpoints) is gone.
`/api/releases`, `/api/releases/{channel}`, and `/api/interfaces` map to
baked JSON under dist/api/, so live-refresh widgets now get build-time
data. Rebuild to refresh.

Lighthouse must stay at 100 in every category; thresholds live in
`lighthouserc.json`.

## Layout

- `src/config/site.ts` - every constant: URLs, locales, nav, docs groups
- `src/config/roadmap.ts` - roadmap milestones
- `src/i18n/` - locale catalogs copied from the Laravel lang files, `t()` helper
- `src/lib/` - build-time data: `releases.ts` (GitHub + Bunny Storage listing when `BUNNY_STORAGE_ACCESS_KEY` is set),
  `changelog.ts`, `interfaces.ts`, `docs.ts`
- `src/content/docs/<locale>/` - markdown docs (en only so far)
- `src/pages/[...locale]/` - one route file per page; `locale` param is
  undefined for en, `de|es|fi|fr|it|nl|ru|zh` for the rest
- `src/pages/api/` - static JSON endpoints baked at build
- `src/components/` - Nav, Footer, Starfield, MeshGlyph, PageHero, CommandBlock, Icon
- `edge/` - FastEdge wasm app (wstd, wasm32-wasip2 cdylib); `build.rs`
  bakes dist/ into the binary
- `public/` - favicons, og cards, showcase shots, branding media
- `scripts/deploy-fastedge.sh` - uploads the wasm binary via the FastEdge API
- `.github/workflows/` - CI (site + edge wasm), Pages preview
  (preview.meshchatx.com), zizmor, Scorecard, CodeQL

## Rules

- No runtime server of our own. Everything is prerendered; external data
  (GitHub releases, interface directory, changelog) is fetched at build
  time.
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
