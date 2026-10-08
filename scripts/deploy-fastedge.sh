#!/bin/sh
# Upload the edge wasm binary to Gcore FastEdge. With GCORE_APP_ID set, also
# points that app at the new binary.
#
#   GCORE_API_KEY=... GCORE_APP_ID=... scripts/deploy-fastedge.sh
set -eu

WASM=${WASM:-edge/target/wasm32-wasip2/release/meshchatx_edge.wasm}
API=https://api.gcore.com/fastedge/v1

[ -f "$WASM" ] || { echo "missing $WASM; run pnpm build:edge first" >&2; exit 1; }
[ -n "${GCORE_API_KEY:-}" ] || { echo "GCORE_API_KEY not set" >&2; exit 1; }

bin_id=$(curl -fsS -X POST "$API/binaries/raw" \
  -H "Authorization: apikey $GCORE_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$WASM" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

if [ -z "$bin_id" ]; then
  echo "upload failed" >&2
  exit 1
fi
echo "binary id: $bin_id"

if [ -n "${GCORE_APP_ID:-}" ]; then
  curl -fsS -X PATCH "$API/apps/$GCORE_APP_ID" \
    -H "Authorization: apikey $GCORE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"binary\": $bin_id}"
  echo
fi
