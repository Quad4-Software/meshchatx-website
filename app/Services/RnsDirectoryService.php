<?php

namespace App\Services;

use App\Support\SafeText;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class RnsDirectoryService
{
    private const CACHE_PAYLOAD = 'meshchatx.rns.directory.payload';

    private const CACHE_STALE = 'meshchatx.rns.directory.stale';

    private const MAX_SEARCH_LENGTH = 128;

    private const MAX_FILTER_LENGTH = 64;

    /**
     * @return array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    public function payload(?string $search = null, ?string $type = null, ?string $network = null): array
    {
        $base = $this->cachedPayload();
        $items = $base['interfaces'];

        $search = is_string($search) ? $this->clip($search, self::MAX_SEARCH_LENGTH) : '';
        $type = is_string($type) ? $this->clip($type, self::MAX_FILTER_LENGTH) : '';
        $network = is_string($network) ? $this->clip($network, self::MAX_FILTER_LENGTH) : '';

        if ($search !== '' || $type !== '' || $network !== '') {
            $needle = mb_strtolower($search);
            $items = array_values(array_filter(
                $items,
                function (array $item) use ($needle, $type, $network): bool {
                    if ($type !== '' && (string) $item['type'] !== $type) {
                        return false;
                    }
                    if ($network !== '' && (string) $item['network'] !== $network) {
                        return false;
                    }
                    if ($needle === '') {
                        return true;
                    }

                    $haystack = mb_strtolower(implode(' ', [
                        (string) $item['name'],
                        (string) $item['host'],
                        (string) $item['type'],
                        (string) $item['typeName'],
                        (string) $item['network'],
                        (string) ($item['port'] ?? ''),
                    ]));

                    return str_contains($haystack, $needle);
                },
            ));
        }

        $base['interfaces'] = $items;
        $base['count'] = count($items);

        return $base;
    }

    /**
     * @return array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function cachedPayload(): array
    {
        $cached = Cache::get(self::CACHE_PAYLOAD);
        if (is_array($cached) && $this->isPayload($cached)) {
            return $cached;
        }

        try {
            return Cache::lock('meshchatx.rns.directory.fetch', 25)
                ->block(10, function () {
                    $cached = Cache::get(self::CACHE_PAYLOAD);
                    if (is_array($cached) && $this->isPayload($cached)) {
                        return $cached;
                    }

                    $fresh = $this->fetchPayload();
                    if ($fresh !== null) {
                        $ttl = $this->cacheTtl();
                        Cache::put(self::CACHE_PAYLOAD, $fresh, $ttl);
                        Cache::put(self::CACHE_STALE, $fresh, $this->staleTtl($ttl));
                        $this->writeSnapshot($fresh);

                        return $fresh;
                    }

                    $stale = Cache::get(self::CACHE_STALE);
                    if (is_array($stale) && $this->isPayload($stale)) {
                        $stale['stale'] = true;
                        Cache::put(self::CACHE_PAYLOAD, $stale, min(300, $this->cacheTtl()));

                        return $stale;
                    }

                    $snapshot = $this->readSnapshot() ?? $this->readBootstrap();
                    if ($snapshot !== null) {
                        $snapshot['stale'] = true;
                        Cache::put(self::CACHE_PAYLOAD, $snapshot, min(300, $this->cacheTtl()));

                        return $snapshot;
                    }

                    $empty = $this->emptyPayload();
                    Cache::put(self::CACHE_PAYLOAD, $empty, 60);

                    return $empty;
                });
        } catch (LockTimeoutException) {
            $stale = Cache::get(self::CACHE_STALE);
            if (is_array($stale) && $this->isPayload($stale)) {
                $stale['stale'] = true;

                return $stale;
            }

            $snapshot = $this->readSnapshot() ?? $this->readBootstrap();
            if ($snapshot !== null) {
                $snapshot['stale'] = true;

                return $snapshot;
            }

            return $this->emptyPayload();
        }
    }

    private function clip(string $value, int $max): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (mb_strlen($value) <= $max) {
            return $value;
        }

        return mb_substr($value, 0, $max);
    }

    /**
     * @return ?array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function fetchPayload(): ?array
    {
        $url = (string) config('meshchatx.rns_directory_api');

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'meshchatx-website',
                ])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();
            if (! is_array($data)) {
                return null;
            }

            return $this->payloadFromRaw($data, now()->toIso8601String(), false);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function payloadFromRaw(array $raw, ?string $fetchedAt, bool $stale): array
    {
        $rows = $raw['data'] ?? $raw['interfaces'] ?? [];
        if (! is_array($rows)) {
            $rows = [];
        }

        $items = [];
        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $item = $this->normalizeItem($row);
            if ($item !== null) {
                $items[] = $item;
            }
        }

        usort($items, fn (array $a, array $b): int => strcasecmp((string) $a['name'], (string) $b['name']));

        $fetched = is_string($raw['fetchedAt'] ?? null) ? (string) $raw['fetchedAt'] : $fetchedAt;

        return [
            'source' => (string) config('meshchatx.rns_directory_url'),
            'sourceApi' => (string) config('meshchatx.rns_directory_api'),
            'fetchedAt' => $fetched,
            'stale' => $stale,
            'count' => count($items),
            'total' => count($items),
            'interfaces' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return ?array<string, mixed>
     */
    private function normalizeItem(array $row): ?array
    {
        $name = $row['name'] ?? null;
        $host = $row['host'] ?? null;
        if (! is_string($name) || $name === '' || ! is_string($host) || $host === '') {
            return null;
        }

        $name = SafeText::plain($name, 200);
        $host = SafeText::plain($host, 253);
        if ($name === '' || $host === '') {
            return null;
        }

        $port = $row['port'] ?? null;
        if (is_numeric($port)) {
            $port = (int) $port;
            if ($port < 1 || $port > 65535) {
                $port = null;
            }
        } else {
            $port = null;
        }

        $config = $row['config'] ?? '';
        if (! is_string($config)) {
            $config = '';
        }
        $config = SafeText::plain($config, 20000);

        $id = $row['id'] ?? null;

        return [
            'id' => is_numeric($id) ? (int) $id : null,
            'name' => $name,
            'type' => is_string($row['type'] ?? null) ? SafeText::plain((string) $row['type'], 64) : '',
            'typeName' => is_string($row['typeName'] ?? null) ? SafeText::plain((string) $row['typeName'], 120) : '',
            'network' => is_string($row['network'] ?? null) ? SafeText::plain((string) $row['network'], 64) : '',
            'host' => $host,
            'port' => $port,
            'status' => is_string($row['status'] ?? null) ? SafeText::plain((string) $row['status'], 64) : '',
            'config' => $config,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isPayload(array $payload): bool
    {
        return isset($payload['interfaces']) && is_array($payload['interfaces']);
    }

    /**
     * @return array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function emptyPayload(): array
    {
        return [
            'source' => (string) config('meshchatx.rns_directory_url'),
            'sourceApi' => (string) config('meshchatx.rns_directory_api'),
            'fetchedAt' => null,
            'stale' => true,
            'count' => 0,
            'total' => 0,
            'interfaces' => [],
        ];
    }

    private function cacheTtl(): int
    {
        return max(3600, min((int) config('meshchatx.rns_directory_cache_seconds', 259200), 604800));
    }

    private function staleTtl(int $ttl): int
    {
        return max($ttl * 10, 7776000);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function writeSnapshot(array $payload): void
    {
        $path = $this->snapshotPath();
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (is_string($json)) {
            file_put_contents($path, $json);
        }
    }

    /**
     * @return ?array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function readSnapshot(): ?array
    {
        return $this->readStoredFile($this->snapshotPath());
    }

    /**
     * @return ?array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function readBootstrap(): ?array
    {
        return $this->readStoredFile(resource_path('data/rns-interfaces.json'));
    }

    /**
     * @return ?array{
     *     source: string,
     *     sourceApi: string,
     *     fetchedAt: ?string,
     *     stale: bool,
     *     count: int,
     *     total: int,
     *     interfaces: list<array<string, mixed>>
     * }
     */
    private function readStoredFile(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }

        $raw = file_get_contents($path);
        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        if (! is_array($decoded)) {
            return null;
        }

        if ($this->isPayload($decoded) && ! isset($decoded['data'])) {
            $decoded['stale'] = true;

            return $decoded;
        }

        return $this->payloadFromRaw($decoded, is_string($decoded['fetchedAt'] ?? null) ? (string) $decoded['fetchedAt'] : null, true);
    }

    private function snapshotPath(): string
    {
        return storage_path('app/private/rns-interfaces.json');
    }
}
