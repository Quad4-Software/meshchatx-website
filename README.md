# MeshChatX website

Static site for [MeshChatX](https://git.quad4.io/RNS-Things/MeshChatX) project: hand-authored HTML partials, one CSS bundle, and a small Go generator that merges locales and emits `index.html`, `download.html`, and localized copies under `de/`, `ru/`, and `it/`.

## Requirements

- Go 1.26 or newer (see `go.mod`)

## Build

From the repository root:

```bash
go run build.go
```

This regenerates all HTML at the project root. Source templates live under `pages/`, `partials/`, and `i18n/`; strings are merged from JSON per locale.

### SEO and social previews

Each page includes `title`, `meta name="description"`, `link rel="canonical"`, `hreflang` alternates, `meta name="robots"`, Open Graph (`og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, alternates), and Twitter Card tags (`twitter:card`, title, description, image). The shared preview image is `https://meshchatx.quad4.io/static/logo.png` (see `siteOrigin` in `build.go`). There is no `sitemap.xml` generator yet; `robots.txt` allows crawlers.

## Container image

Build a production image (nginx serves the generated static files):

```bash
docker build -t meshchatx-website:latest .
```

With Podman:

```bash
podman build -t meshchatx-website:latest .
```

The image runs nginx unprivileged on port **8080**. Optional Compose and Traefik labels are in `docker-compose.yml`.

## Task runner

If you use [Task](https://taskfile.dev/), `task build` runs `go run build.go`; `task docker-build` runs `docker build`.

## License for the website

See `LICENSE`.
