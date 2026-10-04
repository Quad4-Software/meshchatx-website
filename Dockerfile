FROM alpine:3.24 AS runtime
RUN apk add --no-cache lighttpd=1.4.85-r0 \
 && mkdir -p /var/www/html \
 && chown -R lighttpd:lighttpd /var/www/html
COPY docker/lighttpd.conf /etc/lighttpd/lighttpd.conf
EXPOSE 8080
USER lighttpd
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]

FROM node:24-alpine AS build
WORKDIR /src
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG BUNNY_STORAGE_ACCESS_KEY
ARG BUNNY_STORAGE_ZONE=quad4
ARG BUNNY_STORAGE_ENDPOINT=https://ny.storage.bunnycdn.com
ARG BUNNY_CDN_BASE=https://cdn.quad4.io
ENV BUNNY_STORAGE_ACCESS_KEY=$BUNNY_STORAGE_ACCESS_KEY \
    BUNNY_STORAGE_ZONE=$BUNNY_STORAGE_ZONE \
    BUNNY_STORAGE_ENDPOINT=$BUNNY_STORAGE_ENDPOINT \
    BUNNY_CDN_BASE=$BUNNY_CDN_BASE
RUN pnpm build

FROM runtime AS site
USER root
COPY --from=build /src/dist /var/www/html
RUN chown -R lighttpd:lighttpd /var/www/html
USER lighttpd

FROM site AS web
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest
LABEL org.opencontainers.image.title="MeshChatX website" \
      org.opencontainers.image.description="Static MeshChatX marketing site (lighttpd)" \
      org.opencontainers.image.source="https://github.com/Quad4-Software/meshchatx-website" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}"
