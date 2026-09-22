#!/usr/bin/env bash
# Regenerate 1200x630 Open Graph card images into public/og/.
# Pulls page titles/descriptions from lang/en.json. Requires ImageMagick 7
# and Noto Sans (paths below).
set -euo pipefail

cd "$(dirname "$0")/.."

OUT=public/og
mkdir -p "$OUT"

FONT_B="${OG_FONT_BOLD:-/usr/share/fonts/noto/NotoSans-Bold.ttf}"
FONT_R="${OG_FONT_REGULAR:-/usr/share/fonts/noto/NotoSans-Regular.ttf}"
FONT_M="${OG_FONT_MEDIUM:-/usr/share/fonts/noto/NotoSans-Medium.ttf}"

render() {
    local slug="$1" title="$2" subtitle="$3"
    magick -size 1200x630 canvas:'#fafafa' \
        -fill '#2563eb' -draw 'rectangle 0,0 12,630' \
        \( public/logo.webp -resize 112x112 \) -gravity northwest -geometry +72+64 -composite \
        -font "$FONT_B" -pointsize 40 -fill '#18181b' -annotate +204+138 'MeshChatX' \
        \( -background none -fill '#18181b' -font "$FONT_B" -pointsize 82 -size 1050x200 caption:"$title" \) \
            -gravity northwest -geometry +72+270 -composite \
        \( -background none -fill '#52525b' -font "$FONT_R" -pointsize 32 -size 1050x120 caption:"$subtitle" \) \
            -gravity northwest -geometry +72+452 -composite \
        -font "$FONT_M" -pointsize 26 -fill '#a1a1aa' -annotate +72+574 'meshchatx.com' \
        -quality 88 "public/og/${slug}.webp"
}

meta() {
    php -r '
        $d = json_decode(file_get_contents("lang/en.json"), true);
        $page = $argv[1];
        $field = $argv[2];
        $v = $d["meta"][$field][$page] ?? "";
        $v = preg_replace("/\s*\|\s*MeshChatX\s*$/", "", (string) $v);
        echo $v;
    ' "$1" "$2"
}

render card "$(meta home title)" "$(meta home desc)"

for page in download docs dependency interfaces changelog roadmap branding contact donate git license privacy; do
    render "card-${page}" "$(meta "$page" title)" "$(meta "$page" desc)"
done
