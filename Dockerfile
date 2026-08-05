# syntax=docker/dockerfile:1.7

# MeshChatX website
# Multi-stage, rootless, digest-pinned images

ARG PHP_IMAGE=php:8.5-fpm-alpine@sha256:9dc81f4086ea5402227a6bcc489b04b4baba12394624d9621faa92ed812fb8ee
ARG COMPOSER_IMAGE=composer:2@sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040
ARG NODE_IMAGE=node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=0.1.0

# -----------------------------------------------------------------------------
# PHP dependencies
# -----------------------------------------------------------------------------
FROM ${COMPOSER_IMAGE} AS vendor

WORKDIR /app

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer \
    COMPOSER_NO_INTERACTION=1

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-progress

COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY lang ./lang
COPY routes ./routes
COPY artisan ./artisan

RUN composer dump-autoload \
    --optimize \
    --classmap-authoritative \
    --no-dev \
    --no-scripts

# -----------------------------------------------------------------------------
# Frontend assets
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS frontend

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_ENABLE_STRICT=0 \
    PNPM_HOME=/pnpm \
    PATH="/pnpm:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@11.20.0 --activate \
    && pnpm --version

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN pnpm install --frozen-lockfile

COPY vite.config.js ./
COPY resources ./resources
COPY public ./public

ENV NODE_ENV=production

RUN pnpm run build \
    && rm -rf node_modules

# -----------------------------------------------------------------------------
# Application runtime (php-fpm, rootless)
# -----------------------------------------------------------------------------
FROM ${PHP_IMAGE} AS app

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG PHP_IMAGE

LABEL org.opencontainers.image.title="MeshChatX Website" \
      org.opencontainers.image.description="Public marketing site for MeshChatX (Laravel + Blade)" \
      org.opencontainers.image.url="https://meshchatx.com" \
      org.opencontainers.image.source="https://github.com/MeshChatX/website" \
      org.opencontainers.image.vendor="Quad4" \
      org.opencontainers.image.licenses="0BSD" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.base.name="php:8.5-fpm-alpine" \
      org.opencontainers.image.base.digest="sha256:9dc81f4086ea5402227a6bcc489b04b4baba12394624d9621faa92ed812fb8ee"

WORKDIR /var/www/html

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0

RUN apk add --no-cache --no-scripts \
        fcgi \
    && docker-php-ext-install -j"$(nproc)" opcache \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php/zz-www.conf /usr/local/etc/php-fpm.d/zz-www.conf

COPY --chown=www-data:www-data artisan ./
COPY --chown=www-data:www-data app ./app
COPY --chown=www-data:www-data bootstrap ./bootstrap
COPY --chown=www-data:www-data config ./config
COPY --chown=www-data:www-data database ./database
COPY --chown=www-data:www-data lang ./lang
COPY --chown=www-data:www-data public ./public
COPY --chown=www-data:www-data resources ./resources
COPY --chown=www-data:www-data routes ./routes
COPY --chown=www-data:www-data composer.json composer.lock ./

COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

COPY --chown=www-data:www-data docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod 0555 /usr/local/bin/entrypoint.sh \
    && sed -i \
        -e 's/^user = .*/; user managed by container USER/' \
        -e 's/^group = .*/; group managed by container USER/' \
        /usr/local/etc/php-fpm.d/www.conf \
    && mkdir -p \
        storage/app/public \
        storage/app/private \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache \
    && rm -rf /tmp/* /var/tmp/*

USER www-data

EXPOSE 9000

STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET \
        cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm", "-F"]

# -----------------------------------------------------------------------------
# Web runtime (nginx, rootless)
# -----------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS web

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="MeshChatX Website (nginx)" \
      org.opencontainers.image.description="Rootless nginx front for the MeshChatX marketing site" \
      org.opencontainers.image.url="https://meshchatx.com" \
      org.opencontainers.image.source="https://github.com/MeshChatX/website" \
      org.opencontainers.image.vendor="Quad4" \
      org.opencontainers.image.licenses="0BSD" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.base.name="nginxinc/nginx-unprivileged:1.27-alpine" \
      org.opencontainers.image.base.digest="sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0"

USER root

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public

RUN chown -R nginx:nginx /var/www/html/public \
    && chmod -R a=rX /var/www/html/public

USER nginx

EXPOSE 8080

STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/up || exit 1
