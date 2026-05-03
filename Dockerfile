# syntax=docker.io/docker/dockerfile:1
FROM cgr.dev/chainguard/node:latest-dev AS build

USER root
RUN corepack enable pnpm

WORKDIR /site
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM cgr.dev/chainguard/node:latest AS prod

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV BUNNY_STORAGE_HOST=la.storage.bunnycdn.com
ENV BUNNY_STORAGE_ZONE=meshchatx
ENV BUNNY_VERSIONS_PREFIX=master
ENV BUNNY_STORAGE_ACCESS_KEY=
ENV BUNNY_PUBLIC_BASE_URL=https://meshchatx.b-cdn.net
ENV RELEASES_CACHE_SECONDS=300

COPY --from=build --chown=node:node /site/build ./build

USER node

EXPOSE 8080

CMD ["build"]
