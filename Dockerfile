# syntax=docker.io/docker/dockerfile:1
FROM docker.io/library/node:24-alpine AS build

RUN corepack enable pnpm

WORKDIR /site
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM docker.io/nginxinc/nginx-unprivileged:stable-alpine

USER root
COPY docker/nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/build/ /usr/share/nginx/html/
RUN chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080
