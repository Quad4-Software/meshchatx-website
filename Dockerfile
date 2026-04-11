FROM docker.io/library/golang:1.26-alpine AS builder

WORKDIR /site
COPY . .
RUN go run build.go

FROM docker.io/nginxinc/nginx-unprivileged:stable-alpine

USER root
COPY --from=builder /site/ /usr/share/nginx/html/
RUN rm -f /usr/share/nginx/html/build.go /usr/share/nginx/html/go.mod /usr/share/nginx/html/go.sum && \
    rm -rf /usr/share/nginx/html/pages /usr/share/nginx/html/partials /usr/share/nginx/html/i18n && \
    rm -f /usr/share/nginx/html/icons-sprite.html && \
    chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080
