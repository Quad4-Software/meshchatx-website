#!/usr/bin/env bash
# Regenerate responsive srcset variants for public/showcase images.
# Run after adding or replacing a 1800px source .webp in light/ or dark/.
set -euo pipefail

cd "$(dirname "$0")/../public/showcase"

for dir in light dark; do
    for f in "$dir"/*.webp; do
        case "$f" in
            *-800w.webp | *-1280w.webp) continue ;;
        esac
        base="${f%.webp}"
        magick "$f" -resize 800x -quality 82 "${base}-800w.webp"
        magick "$f" -resize 1280x -quality 82 "${base}-1280w.webp"
    done
done
