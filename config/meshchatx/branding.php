<?php

$raw = json_decode(
    (string) file_get_contents(__DIR__.'/branding-assets.json'),
    true
);

$groups = [
    'logo' => [],
    'icon' => [],
    'wordmark' => [],
];

if (is_array($raw)) {
    foreach ($raw as $row) {
        [$kind, $size, $format, $path] = $row;
        if (! isset($groups[$kind])) {
            continue;
        }
        $groups[$kind][] = [
            'size' => (int) $size,
            'format' => (string) $format,
            'path' => (string) $path,
            'label' => strtoupper((string) $format).' · '.$size.'px',
        ];
    }
}

foreach ($groups as $kind => $items) {
    usort($items, function (array $a, array $b): int {
        if ($a['size'] === $b['size']) {
            return strcmp($a['format'], $b['format']);
        }

        return $b['size'] <=> $a['size'];
    });
    $groups[$kind] = $items;
}

return [
    'title' => 'Branding',
    'intro' => 'Official MeshChatX marks for press, docs, and app stores. Keep clear space around the mark and do not recolor the glyph.',
    'usage' => [
        'Use the transparent PNG or WebP on light or dark surfaces.',
        'Use the light JPG on white backgrounds and the dark JPG on near-black backgrounds.',
        'Prefer the ICO for legacy favicon slots. Prefer PNG or WebP everywhere else.',
    ],
    'colors' => [
        ['name' => 'Ink', 'hex' => '#18181b', 'token' => '--color-ink'],
        ['name' => 'Paper', 'hex' => '#fafafa', 'token' => '--color-paper'],
        ['name' => 'Accent', 'hex' => '#1d4ed8', 'token' => '--color-accent'],
        ['name' => 'Accent soft', 'hex' => '#1d4ed8', 'token' => '--color-accent-soft'],
        ['name' => 'Muted', 'hex' => '#71717a', 'token' => '--color-muted'],
        ['name' => 'Line', 'hex' => '#e4e4e7', 'token' => '--color-line'],
    ],
    'assets' => $groups,
];
