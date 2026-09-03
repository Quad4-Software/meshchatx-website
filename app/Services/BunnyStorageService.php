<?php

namespace App\Services;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BunnyStorageService
{
    private const CACHE_CATALOG = 'meshchatx.bunny.catalog';

    private const CACHE_CATALOG_STALE = 'meshchatx.bunny.catalog.stale';

    /**
     * @var array{versions: array<string, array{channel: string, tag: string, path: string, publishedAt: string}>}|null
     */
    private ?array $catalogMemo = null;

    /**
     * @var array<string, array<string, array{name: string, path: string, url: string, sha256: ?string}>>
     */
    private array $assetsMemo = [];

    public function enabled(): bool
    {
        return trim((string) config('services.bunny.access_key', '')) !== ''
            && trim((string) config('services.bunny.storage_zone', '')) !== ''
            && trim((string) config('services.bunny.cdn_base', '')) !== '';
    }

    /**
     * Flat asset map keyed by lowercase basename for a release tag.
     * One cached Storage walk per version path.
     *
     * @return array<string, array{name: string, path: string, url: string, sha256: ?string}>
     */
    public function assetsByName(string $tag): array
    {
        if (! $this->enabled()) {
            return [];
        }

        $tag = trim($tag);
        if ($tag === '') {
            return [];
        }

        $path = $this->pathForTag($tag);
        if ($path === null) {
            return [];
        }

        return $this->cachedAssets($path);
    }

    /**
     * @return list<array{channel: string, tag: string, path: string, publishedAt: string}>
     */
    public function versions(): array
    {
        return array_values($this->catalog()['versions']);
    }

    public function pathForTag(string $tag): ?string
    {
        $tag = trim($tag);
        if ($tag === '') {
            return null;
        }

        $versions = $this->catalog()['versions'];
        if (isset($versions[$tag])) {
            return $versions[$tag]['path'];
        }

        $bare = (string) (preg_replace('/^v/i', '', $tag) ?? $tag);
        foreach ([$tag, 'v'.$bare, $bare] as $candidate) {
            if (isset($versions[$candidate])) {
                return $versions[$candidate]['path'];
            }
        }

        return null;
    }

    /**
     * @return array{versions: array<string, array{channel: string, tag: string, path: string, publishedAt: string}>}
     */
    private function catalog(): array
    {
        if ($this->catalogMemo !== null) {
            return $this->catalogMemo;
        }

        if (! $this->enabled()) {
            return $this->catalogMemo = ['versions' => []];
        }

        $ttl = $this->cacheTtl();
        $cached = Cache::get(self::CACHE_CATALOG);
        if (is_array($cached) && isset($cached['versions']) && is_array($cached['versions'])) {
            return $this->catalogMemo = $cached;
        }

        try {
            return $this->catalogMemo = Cache::lock('meshchatx.bunny.catalog.fetch', 25)
                ->block(10, function () use ($ttl) {
                    $cached = Cache::get(self::CACHE_CATALOG);
                    if (is_array($cached) && isset($cached['versions']) && is_array($cached['versions'])) {
                        return $cached;
                    }

                    $fresh = $this->fetchCatalog();
                    if ($fresh['versions'] !== []) {
                        Cache::put(self::CACHE_CATALOG, $fresh, $ttl);
                        Cache::put(self::CACHE_CATALOG_STALE, $fresh, max($ttl * 12, 43200));

                        return $fresh;
                    }

                    $stale = Cache::get(self::CACHE_CATALOG_STALE);
                    if (is_array($stale) && isset($stale['versions']) && is_array($stale['versions']) && $stale['versions'] !== []) {
                        Cache::put(self::CACHE_CATALOG, $stale, min(300, $ttl));

                        return $stale;
                    }

                    $empty = ['versions' => []];
                    Cache::put(self::CACHE_CATALOG, $empty, 60);

                    return $empty;
                });
        } catch (LockTimeoutException) {
            $stale = Cache::get(self::CACHE_CATALOG_STALE);
            if (is_array($stale) && isset($stale['versions']) && is_array($stale['versions'])) {
                return $this->catalogMemo = $stale;
            }

            return $this->catalogMemo = ['versions' => []];
        }
    }

    /**
     * @return array{versions: array<string, array{channel: string, tag: string, path: string, publishedAt: string}>}
     */
    private function fetchCatalog(): array
    {
        $channels = $this->listDirectory('');
        $versions = [];

        foreach ($channels as $entry) {
            if (($entry['IsDirectory'] ?? false) !== true) {
                continue;
            }
            $channel = (string) ($entry['ObjectName'] ?? '');
            if ($channel === '' || str_starts_with($channel, '.')) {
                continue;
            }

            foreach ($this->listDirectory($channel) as $child) {
                if (($child['IsDirectory'] ?? false) !== true) {
                    continue;
                }
                $tag = (string) ($child['ObjectName'] ?? '');
                if ($tag === '' || str_starts_with($tag, '.')) {
                    continue;
                }

                $published = (string) ($child['DateCreated'] ?? $child['LastChanged'] ?? '');
                $path = $channel.'/'.$tag;
                $versions[$tag] = [
                    'channel' => $channel,
                    'tag' => $tag,
                    'path' => $path,
                    'publishedAt' => $published !== '' ? $published : gmdate('c'),
                ];
            }
        }

        return ['versions' => $versions];
    }

    /**
     * @return array<string, array{name: string, path: string, url: string, sha256: ?string}>
     */
    private function cachedAssets(string $path): array
    {
        if (isset($this->assetsMemo[$path])) {
            return $this->assetsMemo[$path];
        }

        $cacheKey = 'meshchatx.bunny.assets.'.hash('xxh128', $path);
        $staleKey = $cacheKey.'.stale';
        $ttl = $this->cacheTtl();

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $this->assetsMemo[$path] = $cached;
        }

        try {
            $assets = Cache::lock('meshchatx.bunny.assets.'.$path, 25)
                ->block(10, function () use ($path, $cacheKey, $staleKey, $ttl) {
                    $cached = Cache::get($cacheKey);
                    if (is_array($cached)) {
                        return $cached;
                    }

                    $fresh = $this->walkAssets($path);
                    if ($fresh !== []) {
                        Cache::put($cacheKey, $fresh, $ttl);
                        Cache::put($staleKey, $fresh, max($ttl * 12, 43200));

                        return $fresh;
                    }

                    $stale = Cache::get($staleKey);
                    if (is_array($stale) && $stale !== []) {
                        Cache::put($cacheKey, $stale, min(300, $ttl));

                        return $stale;
                    }

                    Cache::put($cacheKey, [], 60);

                    return [];
                });
        } catch (LockTimeoutException) {
            $stale = Cache::get($staleKey);
            $assets = is_array($stale) ? $stale : [];
        }

        return $this->assetsMemo[$path] = is_array($assets) ? $assets : [];
    }

    /**
     * @return array<string, array{name: string, path: string, url: string, sha256: ?string}>
     */
    private function walkAssets(string $path): array
    {
        $cdnBase = rtrim((string) config('services.bunny.cdn_base'), '/');
        $out = [];
        $queue = [$this->normalizePath($path)];

        while ($queue !== []) {
            $dir = array_shift($queue);
            if (! is_string($dir)) {
                continue;
            }

            foreach ($this->listDirectory($dir) as $entry) {
                $name = (string) ($entry['ObjectName'] ?? '');
                if ($name === '' || str_starts_with($name, '.')) {
                    continue;
                }

                $childPath = $dir === '' ? $name : $dir.'/'.$name;
                if (($entry['IsDirectory'] ?? false) === true) {
                    $queue[] = $childPath;

                    continue;
                }

                $checksum = $entry['Checksum'] ?? null;
                $out[strtolower($name)] = [
                    'name' => $name,
                    'path' => $childPath,
                    'url' => $cdnBase.'/'.$childPath,
                    'sha256' => is_string($checksum) ? $this->normalizeSha256($checksum) : null,
                ];
            }
        }

        return $out;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listDirectory(string $path): array
    {
        $zone = trim((string) config('services.bunny.storage_zone'));
        $endpoint = rtrim((string) config('services.bunny.storage_endpoint'), '/');
        $key = trim((string) config('services.bunny.access_key'));
        if ($zone === '' || $endpoint === '' || $key === '') {
            return [];
        }

        $relative = $this->normalizePath($path);
        $url = $endpoint.'/'.$zone.'/';
        if ($relative !== '') {
            $url .= $relative.'/';
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'AccessKey' => $key,
                    'Accept' => 'application/json',
                    'User-Agent' => 'meshchatx-website',
                ])
                ->get($url);

            if (! $response->successful()) {
                return [];
            }

            $data = $response->json();
            if (! is_array($data)) {
                return [];
            }

            $out = [];
            foreach ($data as $item) {
                if (is_array($item)) {
                    $out[] = $item;
                }
            }

            return $out;
        } catch (\Throwable) {
            return [];
        }
    }

    private function normalizePath(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path), '/');
        if ($path === '' || $path === '.') {
            return '';
        }

        $parts = [];
        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                return '';
            }
            $parts[] = $part;
        }

        return implode('/', $parts);
    }

    private function normalizeSha256(?string $digest): ?string
    {
        if (! is_string($digest) || $digest === '') {
            return null;
        }

        $digest = trim($digest);
        if (preg_match('/^sha256:([a-f0-9]{64})$/i', $digest, $m) === 1) {
            return strtolower($m[1]);
        }
        if (preg_match('/^[a-f0-9]{64}$/i', $digest) === 1) {
            return strtolower($digest);
        }

        return null;
    }

    private function cacheTtl(): int
    {
        return max(60, min((int) config('meshchatx.releases_cache_seconds', 3600), 86400));
    }
}
