FROM cgr.dev/chainguard/node:latest-dev AS builder

ENV NODE_ENV=development

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
USER root
RUN corepack enable pnpm && pnpm install --frozen-lockfile && chown -R node:node /app
USER node

COPY --chown=node:node . .
ENV CI=true
RUN pnpm install --frozen-lockfile && pnpm run build

RUN pnpm prune --prod

FROM cgr.dev/chainguard/node:latest

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./

EXPOSE 8080

USER node

CMD ["build/index.js"]
