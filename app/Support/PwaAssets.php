<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

class PwaAssets
{
    public static function cacheVersion(): string
    {
        $manifest = public_path('build/manifest.json');
        if (File::isFile($manifest)) {
            return substr((string) sha1_file($manifest), 0, 12);
        }

        return 'dev';
    }

    /**
     * @return list<string>
     */
    public static function precacheUrls(): array
    {
        $urls = [
            '/',
            '/docs/overview',
            '/interfaces',
            '/changelog',
            '/offline',
            '/manifest.webmanifest',
            '/theme-boot.js',
            '/logo.webp',
            '/logo-navbar.webp',
            '/favicon.webp',
            '/favicon.ico',
        ];

        foreach (self::viteUrls() as $url) {
            $urls[] = $url;
        }

        $urls = array_values(array_unique($urls));
        sort($urls);

        return $urls;
    }

    /**
     * @return list<string>
     */
    public static function viteUrls(): array
    {
        $path = public_path('build/manifest.json');
        if (! File::isFile($path)) {
            return [];
        }

        /** @var mixed $decoded */
        $decoded = json_decode((string) File::get($path), true);
        if (! is_array($decoded)) {
            return [];
        }

        $urls = [];
        foreach ($decoded as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            if (! empty($entry['file']) && is_string($entry['file'])) {
                $urls[] = '/build/'.$entry['file'];
            }
            foreach ($entry['css'] ?? [] as $css) {
                if (is_string($css) && $css !== '') {
                    $urls[] = '/build/'.$css;
                }
            }
            foreach ($entry['assets'] ?? [] as $asset) {
                if (is_string($asset) && $asset !== '') {
                    $urls[] = '/build/'.$asset;
                }
            }
        }

        return array_values(array_unique($urls));
    }
}
