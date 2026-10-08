#!/bin/sh
# Build the FastEdge wasm binary. Runs wasm-opt -Os when binaryen is on PATH.
set -eu

cargo build --release --target wasm32-wasip2 --manifest-path edge/Cargo.toml
WASM=edge/target/wasm32-wasip2/release/meshchatx_edge.wasm

if command -v wasm-opt >/dev/null 2>&1 \
  && wasm-opt -Os "$WASM" -o "$WASM.opt" 2>/dev/null; then
  mv "$WASM.opt" "$WASM"
else
  rm -f "$WASM.opt"
fi
du -h "$WASM"
