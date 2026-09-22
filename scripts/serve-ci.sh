#!/usr/bin/env bash
# Serve the site like production (nginx + php-fpm) for Lighthouse runs.
# Falls back to php artisan serve when nginx or php-fpm is unavailable,
# e.g. local dev machines.
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${1:-4173}"
HOST="127.0.0.1"
ROOT="$(pwd)"
RUN="${TMPDIR:-/tmp}/mcx-serve-ci"
mkdir -p "$RUN"

rm -f public/hot
APP_ENV=production php artisan config:clear >/dev/null

PHP_MINOR="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
FPM_BIN=""
for candidate in php-fpm "php-fpm${PHP_MINOR}" "php${PHP_MINOR}-fpm"; do
    if command -v "$candidate" >/dev/null 2>&1; then
        FPM_BIN="$candidate"
        break
    fi
done

if ! command -v nginx >/dev/null 2>&1 || [ -z "$FPM_BIN" ]; then
    echo "nginx/php-fpm not found, falling back to artisan serve" >&2
    exec php artisan serve --host="$HOST" --port="$PORT"
fi

MIME_TYPES=""
FASTCGI_PARAMS=""
for candidate in /etc/nginx/mime.types /usr/local/etc/nginx/mime.types; do
    [ -f "$candidate" ] && MIME_TYPES="$candidate" && break
done
for candidate in /etc/nginx/fastcgi_params /usr/local/etc/nginx/fastcgi_params; do
    [ -f "$candidate" ] && FASTCGI_PARAMS="$candidate" && break
done
[ -n "$MIME_TYPES" ] || { echo "mime.types not found" >&2; exit 1; }
[ -n "$FASTCGI_PARAMS" ] || { echo "fastcgi_params not found" >&2; exit 1; }

cat > "$RUN/php-fpm.conf" <<EOF
[global]
pid = $RUN/php-fpm.pid
error_log = $RUN/php-fpm.log
daemonize = yes
log_level = warning

[www]
listen = $RUN/php-fpm.sock
pm = dynamic
pm.max_children = 8
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
clear_env = no
catch_workers_output = yes
EOF

cat > "$RUN/nginx.conf" <<EOF
pid $RUN/nginx.pid;
error_log $RUN/nginx.error.log warn;
worker_processes 2;

events {
    worker_connections 256;
}

http {
    include $MIME_TYPES;
    default_type application/octet-stream;
    access_log off;
    sendfile on;

    client_body_temp_path $RUN/body;
    proxy_temp_path $RUN/proxy;
    fastcgi_temp_path $RUN/fcgi;
    uwsgi_temp_path $RUN/uwsgi;
    scgi_temp_path $RUN/scgi;

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types text/plain text/css application/javascript application/json application/manifest+json image/svg+xml;

    server {
        listen $HOST:$PORT;
        root $ROOT/public;
        index index.php;

        location / {
            try_files \$uri \$uri/ /index.php?\$query_string;
        }

        location ~ \.php$ {
            include $FASTCGI_PARAMS;
            fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
            fastcgi_param APP_ENV production;
            fastcgi_pass unix:$RUN/php-fpm.sock;
        }
    }
}
EOF

"$FPM_BIN" -y "$RUN/php-fpm.conf" -F &
FPM_PID=$!
nginx -c "$RUN/nginx.conf" &
NGINX_PID=$!

cleanup() {
    kill "$NGINX_PID" "$FPM_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait -n "$NGINX_PID" "$FPM_PID"
