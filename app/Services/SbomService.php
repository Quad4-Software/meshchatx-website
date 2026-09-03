<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SbomService
{
    private const CACHE_PAYLOAD_PREFIX = 'meshchatx.sbom.payload.v2.';

    private const CACHE_RAW_PREFIX = 'meshchatx.sbom.raw.';

    private const CACHE_MISS_PREFIX = 'meshchatx.sbom.miss.';

    public function __construct(
        private readonly GithubReleasesService $releases,
    ) {}

    /**
     * @return array{versions: list<array<string, mixed>>, defaultVersion: ?string, source: string}
     */
    public function catalog(): array
    {
        $versions = [];
        foreach ($this->releases->sbomReleases() as $row) {
            $key = $this->cacheKey($row['version'], $row['tag']);
            $versions[] = [
                'version' => $row['version'],
                'tag' => $row['tag'],
                'publishedAt' => $row['publishedAt'],
                'isPrerelease' => $row['isPrerelease'],
                'releaseUrl' => $row['releaseUrl'],
                'sbomUrl' => $row['sbomUrl'],
                'cached' => Cache::has(self::CACHE_PAYLOAD_PREFIX.$key),
            ];
        }

        $default = null;
        foreach ($versions as $row) {
            if (! $row['isPrerelease']) {
                $default = $row['version'];
                break;
            }
        }
        if ($default === null && $versions !== []) {
            $default = $versions[0]['version'];
        }

        return [
            'versions' => $versions,
            'defaultVersion' => $default,
            'source' => (string) config('meshchatx.github_releases'),
        ];
    }

    /**
     * Resolve a version or tag to a normalized SBOM graph payload.
     *
     * @return ?array<string, mixed>
     */
    public function forVersion(string $version): ?array
    {
        $release = $this->findRelease($version);
        if ($release === null) {
            return null;
        }

        $key = $this->cacheKey($release['version'], $release['tag']);
        $cached = Cache::get(self::CACHE_PAYLOAD_PREFIX.$key);
        if (is_array($cached) && $this->isPayload($cached)) {
            return $cached;
        }

        if (Cache::has(self::CACHE_MISS_PREFIX.$key)) {
            return null;
        }

        $raw = $this->fetchRaw($release['sbomUrl'], $key);
        if ($raw === null) {
            Cache::put(self::CACHE_MISS_PREFIX.$key, 1, 300);

            return null;
        }

        $payload = $this->normalize($raw, $release);
        Cache::put(self::CACHE_PAYLOAD_PREFIX.$key, $payload, $this->cacheTtl());
        Cache::forget(self::CACHE_MISS_PREFIX.$key);

        return $payload;
    }

    /**
     * Fetch and cache SBOMs that are not yet stored. Returns how many were newly cached.
     */
    public function warmMissing(int $limit = 8): int
    {
        $limit = max(0, min($limit, 40));
        if ($limit === 0) {
            return 0;
        }

        $pending = [];
        foreach ($this->releases->sbomReleases() as $row) {
            $key = $this->cacheKey($row['version'], $row['tag']);
            if (Cache::has(self::CACHE_PAYLOAD_PREFIX.$key)) {
                continue;
            }
            if (Cache::has(self::CACHE_MISS_PREFIX.$key)) {
                continue;
            }
            $pending[] = $row;
            if (count($pending) >= $limit) {
                break;
            }
        }

        $warmed = 0;
        foreach ($pending as $row) {
            if ($this->forVersion($row['tag']) !== null) {
                $warmed++;
            }
        }

        return $warmed;
    }

    /**
     * @return ?array{version: string, tag: string, publishedAt: string, isPrerelease: bool, releaseUrl: string, sbomUrl: string}
     */
    private function findRelease(string $needle): ?array
    {
        $needle = trim($needle);
        if ($needle === '') {
            return null;
        }

        $normalized = ltrim($needle, 'vV');

        foreach ($this->releases->sbomReleases() as $row) {
            if ($row['tag'] === $needle || $row['version'] === $needle || $row['version'] === $normalized) {
                return $row;
            }
            if (strcasecmp($row['tag'], $needle) === 0) {
                return $row;
            }
        }

        return null;
    }

    /**
     * @return ?array<string, mixed>
     */
    private function fetchRaw(string $url, string $cacheKey): ?array
    {
        $cached = Cache::get(self::CACHE_RAW_PREFIX.$cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::timeout(45)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'meshchatx-website',
                ])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();
            if (! is_array($data) || ($data['bomFormat'] ?? null) !== 'CycloneDX') {
                return null;
            }

            Cache::put(self::CACHE_RAW_PREFIX.$cacheKey, $data, $this->cacheTtl());

            return $data;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $bom
     * @param  array{version: string, tag: string, publishedAt: string, isPrerelease: bool, releaseUrl: string, sbomUrl: string}  $release
     * @return array<string, mixed>
     */
    private function normalize(array $bom, array $release): array
    {
        $meta = is_array($bom['metadata'] ?? null) ? $bom['metadata'] : [];
        $root = is_array($meta['component'] ?? null) ? $meta['component'] : null;
        $components = is_array($bom['components'] ?? null) ? $bom['components'] : [];
        $dependencies = is_array($bom['dependencies'] ?? null) ? $bom['dependencies'] : [];

        $byRef = [];
        if ($root !== null) {
            $rootRef = $this->componentRef($root);
            if ($rootRef !== null) {
                $byRef[$rootRef] = $root;
            }
        }

        foreach ($components as $component) {
            if (! is_array($component)) {
                continue;
            }
            $ref = $this->componentRef($component);
            if ($ref === null) {
                continue;
            }
            $byRef[$ref] = $component;
        }

        foreach ($dependencies as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $ref = $entry['ref'] ?? null;
            if (! is_string($ref) || $ref === '' || isset($byRef[$ref])) {
                continue;
            }
            $byRef[$ref] = [
                'bom-ref' => $ref,
                'type' => 'library',
                'name' => $this->nameFromRef($ref),
                'purl' => str_starts_with($ref, 'pkg:') ? $ref : null,
            ];
        }

        $refToId = [];
        $nodes = [];
        $id = 0;
        foreach ($byRef as $ref => $component) {
            $refToId[$ref] = $id;
            $nodes[] = $this->nodeFromComponent($id, $component, $ref);
            $id++;
        }

        $edges = [];
        $seenEdge = [];
        foreach ($dependencies as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $fromRef = $entry['ref'] ?? null;
            if (! is_string($fromRef) || ! isset($refToId[$fromRef])) {
                continue;
            }
            $fromId = $refToId[$fromRef];
            $dependsOn = $entry['dependsOn'] ?? [];
            if (! is_array($dependsOn)) {
                continue;
            }
            foreach ($dependsOn as $toRef) {
                if (! is_string($toRef) || ! isset($refToId[$toRef])) {
                    continue;
                }
                $toId = $refToId[$toRef];
                $edgeKey = $fromId.'>'.$toId;
                if (isset($seenEdge[$edgeKey])) {
                    continue;
                }
                $seenEdge[$edgeKey] = true;
                $edges[] = [$fromId, $toId];
            }
        }

        $rootId = null;
        if ($root !== null) {
            $rootRef = $this->componentRef($root);
            if ($rootRef !== null && isset($refToId[$rootRef])) {
                $rootId = $refToId[$rootRef];
            }
        }

        $manifestIds = [];
        if ($rootId !== null) {
            foreach ($edges as [$from, $to]) {
                if ($from === $rootId) {
                    $manifestIds[] = $to;
                }
            }
        }

        $ecosystems = [];
        $licenses = [];
        $types = [];
        foreach ($nodes as $node) {
            $eco = $node['ecosystem'];
            if (is_string($eco) && $eco !== '') {
                $ecosystems[$eco] = ($ecosystems[$eco] ?? 0) + 1;
            }
            $lic = $node['license'];
            if (is_string($lic) && $lic !== '') {
                $licenses[$lic] = ($licenses[$lic] ?? 0) + 1;
            }
            $type = $node['type'];
            if (is_string($type) && $type !== '') {
                $types[$type] = ($types[$type] ?? 0) + 1;
            }
        }
        arsort($ecosystems);
        arsort($licenses);
        arsort($types);

        $tool = $this->toolLabel($meta);

        return [
            'version' => $release['version'],
            'tag' => $release['tag'],
            'publishedAt' => $release['publishedAt'],
            'isPrerelease' => $release['isPrerelease'],
            'releaseUrl' => $release['releaseUrl'],
            'sourceUrl' => $release['sbomUrl'],
            'generatedAt' => is_string($meta['timestamp'] ?? null) ? $meta['timestamp'] : null,
            'tool' => $tool,
            'specVersion' => is_string($bom['specVersion'] ?? null) ? $bom['specVersion'] : null,
            'stats' => [
                'components' => count($nodes),
                'edges' => count($edges),
                'ecosystems' => $ecosystems,
                'licenses' => $licenses,
                'types' => $types,
            ],
            'rootId' => $rootId,
            'manifestIds' => $manifestIds,
            'nodes' => $nodes,
            'edges' => $edges,
        ];
    }

    /**
     * @param  array<string, mixed>  $component
     * @return array{id: int, name: string, label: string, kind: string, version: ?string, ecosystem: ?string, type: string, license: ?string, purl: ?string, logo: bool}
     */
    private function nodeFromComponent(int $id, array $component, string $ref): array
    {
        $name = is_string($component['name'] ?? null) && $component['name'] !== ''
            ? $component['name']
            : $this->nameFromRef($ref);
        $version = is_string($component['version'] ?? null) ? $component['version'] : null;
        $purl = is_string($component['purl'] ?? null) ? $component['purl'] : null;
        if ($purl === null && str_starts_with($ref, 'pkg:')) {
            $purl = $ref;
        }
        $type = is_string($component['type'] ?? null) && $component['type'] !== ''
            ? $component['type']
            : 'library';
        $kind = $this->nodeKind($name, $purl, $type);
        $label = $this->displayLabel($name, $purl, $kind);

        return [
            'id' => $id,
            'name' => $name,
            'label' => $label,
            'kind' => $kind,
            'version' => $version,
            'ecosystem' => $this->ecosystemFromPurl($purl),
            'type' => $type,
            'license' => $this->licenseFromComponent($component),
            'purl' => $purl,
            'logo' => $kind === 'app',
        ];
    }

    private function displayLabel(string $name, ?string $purl, string $kind): string
    {
        if ($kind === 'app') {
            return 'MeshChatX';
        }

        if ($name === '.' || $name === '') {
            return 'MeshChatX';
        }

        if (str_contains($name, '/') || str_contains($name, '\\')) {
            $base = basename(str_replace('\\', '/', $name));

            return $base !== '' ? $base : $name;
        }

        $hay = strtolower($name.' '.($purl ?? ''));
        if (str_contains($hay, 'reticulum-meshchatx')) {
            return 'MeshChatX';
        }

        return $name;
    }

    private function nodeKind(string $name, ?string $purl, string $type): string
    {
        $hay = strtolower($name.' '.($purl ?? ''));
        if ($name === '.' || $name === '') {
            return 'app';
        }
        if (str_contains($hay, 'reticulum-meshchatx')) {
            return 'app';
        }
        if (preg_match('/(?:^|[\/])reticulum[_-]meshchatx(?:@|$)/', $hay)) {
            return 'app';
        }

        $base = strtolower(basename(str_replace('\\', '/', $name)));
        if (
            $type === 'application'
            || str_ends_with($base, '.lock')
            || str_ends_with($base, '-lock.yaml')
            || str_ends_with($base, '.txt')
            || str_ends_with($base, '.mod')
            || in_array($base, ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'requirements.txt', 'uv.lock', 'poetry.lock', 'go.mod', 'cargo.lock'], true)
        ) {
            return 'manifest';
        }

        return 'package';
    }

    /**
     * @param  array<string, mixed>  $component
     */
    private function componentRef(array $component): ?string
    {
        $ref = $component['bom-ref'] ?? $component['bom_ref'] ?? null;
        if (is_string($ref) && $ref !== '') {
            return $ref;
        }
        $purl = $component['purl'] ?? null;
        if (is_string($purl) && $purl !== '') {
            return $purl;
        }

        return null;
    }

    private function nameFromRef(string $ref): string
    {
        if (str_starts_with($ref, 'pkg:')) {
            $rest = substr($ref, 4);
            $slash = strpos($rest, '/');
            $body = $slash === false ? $rest : substr($rest, $slash + 1);
            $at = strrpos($body, '@');
            if ($at !== false) {
                $body = substr($body, 0, $at);
            }

            return $body !== '' ? $body : $ref;
        }

        return $ref;
    }

    private function ecosystemFromPurl(?string $purl): ?string
    {
        if ($purl === null || ! str_starts_with($purl, 'pkg:')) {
            return null;
        }
        $rest = substr($purl, 4);
        $slash = strpos($rest, '/');
        $eco = $slash === false ? $rest : substr($rest, 0, $slash);
        $eco = strtolower(trim($eco));

        return $eco !== '' ? $eco : null;
    }

    /**
     * @param  array<string, mixed>  $component
     */
    private function licenseFromComponent(array $component): ?string
    {
        $licenses = $component['licenses'] ?? null;
        if (! is_array($licenses) || $licenses === []) {
            return null;
        }

        $labels = [];
        foreach ($licenses as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            if (isset($entry['expression']) && is_string($entry['expression']) && $entry['expression'] !== '') {
                $labels[] = $entry['expression'];

                continue;
            }
            $license = $entry['license'] ?? null;
            if (! is_array($license)) {
                continue;
            }
            if (isset($license['id']) && is_string($license['id']) && $license['id'] !== '') {
                $labels[] = $license['id'];
            } elseif (isset($license['name']) && is_string($license['name']) && $license['name'] !== '') {
                $labels[] = $license['name'];
            }
        }

        if ($labels === []) {
            return null;
        }

        return implode(' OR ', array_values(array_unique($labels)));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function toolLabel(array $meta): ?string
    {
        $tools = $meta['tools'] ?? null;
        if (! is_array($tools)) {
            return null;
        }

        $components = $tools['components'] ?? $tools;
        if (! is_array($components)) {
            return null;
        }

        foreach ($components as $tool) {
            if (! is_array($tool)) {
                continue;
            }
            $name = $tool['name'] ?? null;
            if (! is_string($name) || $name === '') {
                continue;
            }
            $version = $tool['version'] ?? null;
            if (is_string($version) && $version !== '') {
                return $name.' '.$version;
            }

            return $name;
        }

        return null;
    }

    private function cacheKey(string $version, string $tag): string
    {
        return hash('xxh128', strtolower($tag).'|'.strtolower($version));
    }

    private function cacheTtl(): int
    {
        return max(3600, min((int) config('meshchatx.sbom_cache_seconds', 2592000), 7776000));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isPayload(array $payload): bool
    {
        return isset($payload['nodes'], $payload['edges'], $payload['stats'], $payload['version']);
    }
}
