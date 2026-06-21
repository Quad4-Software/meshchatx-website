# syntax=docker.io/docker/dockerfile:1
FROM cgr.dev/chainguard/node:latest-dev AS build

USER root
ENV CI=true

WORKDIR /site
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@11.8.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM cgr.dev/chainguard/node:latest AS prod

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV RELEASES_CACHE_SECONDS=300

COPY --from=build --chown=node:node /site/build ./build

USER node

EXPOSE 8080

CMD ["build/index.js"]
