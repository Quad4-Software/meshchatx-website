<?php

namespace App\Services;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GithubReleasesService
{
    private const CACHE_RAW = 'meshchatx.releases.raw';

    private const CACHE_RAW_STALE = 'meshchatx.releases.raw.stale';

    private const CACHE_PAYLOAD = 'meshchatx.releases.payload.v2';

    private const CACHE_VERSIONS = 'meshchatx.releases.versions';

    private const CACHE_CHANNEL_VERSIONS = 'meshchatx.releases.channel_versions.v2';

    /** @var list<string> */
    public const CHANNELS = ['stable', 'beta', 'testing'];

    /**
     * @var list<array<string, mixed>>|null
     */
    private ?array $releasesMemo = null;

    /**
     * @var list<array{version: string, tag: string, publishedAt: string, isPrerelease: bool, releaseUrl: string, sbomUrl: string}>|null
     */
    private ?array $sbomReleasesMemo = null;

    public function __construct(
        private readonly BunnyStorageService $bunny,
    ) {}

    /**
     * @return array{
     *     stable: ?array<string, mixed>,
     *     beta: ?array<string, mixed>,
     *     testing: ?array<string, mixed>,
     *     prerelease: ?array<string, mixed>,
     *     githubFallbackUrl: string,
     *     versions: array{
     *         stable: list<array{tag: string, version: string, publishedAt: string}>,
     *         beta: list<array{tag: string, version: string, publishedAt: string}>,
     *         testing: list<array{tag: string, version: string, publishedAt: string}>,
     *         prerelease: list<array{tag: string, version: string, publishedAt: string}>
     *     }
     * }
     */
    public function payload(): array
    {
        return Cache::remember(self::CACHE_PAYLOAD, $this->cacheTtl(), fn () => $this->buildPayload());
    }

    /**
     * Map query/UI channel names onto stable|beta|testing.
     * Legacy: prerelease and nightly map to testing.
     */
    public function normalizeChannel(?string $channel): string
    {
        $channel = strtolower(trim((string) $channel));

        return match ($channel) {
            'beta' => 'beta',
            'testing', 'prerelease', 'nightly', 'pre' => 'testing',
            default => 'stable',
        };
    }

    /**
     * Product channel for a GitHub release tag.
     * Matches MeshChatX CI: nightly/testing → testing, beta/preview → beta, else stable
     * unless the tag is a generic prerelease (RC/alpha/dev), which lands in testing.
     */
    public function channelForTag(string $tag, bool $githubPrerelease = false): string
    {
        $tag = trim($tag);
        if (preg_match('/^(nightly|testing)(-|$)/i', $tag) === 1) {
            return 'testing';
        }
        if (preg_match('/^(beta|preview)(-|$)/i', $tag) === 1) {
            return 'beta';
        }

        $display = $this->versionDisplay($tag);
        if (preg_match('/(^|[-.])beta(\d|\.|$)/i', $display) === 1) {
            return 'beta';
        }

        if ($githubPrerelease || $this->isPrereleaseTag($tag)) {
            return 'testing';
        }

        return 'stable';
    }

    /**
     * @return list<array{tag: string, version: string, publishedAt: string}>
     */
    public function versionsForChannel(string $channel): array
    {
        $channel = $this->normalizeChannel($channel);
        $all = Cache::remember(self::CACHE_CHANNEL_VERSIONS, $this->cacheTtl(), function () {
            $buckets = [
                'stable' => [],
                'beta' => [],
                'testing' => [],
            ];

            foreach ($this->cachedReleases() as $release) {
                $tag = (string) $release['tag_name'];
                $bucket = $this->channelForTag($tag, (bool) ($release['prerelease'] ?? false));
                $buckets[$bucket][] = [
                    'tag' => $tag,
                    'version' => $this->versionDisplay($tag),
                    'publishedAt' => (string) $release['published_at'],
                ];
            }

            return $buckets;
        });

        return $all[$channel] ?? [];
    }

    /**
     * @return ?array<string, mixed>
     */
    public function releaseForTag(string $tag): ?array
    {
        $tag = trim($tag);
        if ($tag === '') {
            return null;
        }

        $bare = $this->versionDisplay($tag);
        foreach ($this->cachedReleases() as $release) {
            $candidate = (string) $release['tag_name'];
            if ($candidate === $tag || $this->versionDisplay($candidate) === $bare) {
                return $this->rowFromRelease($release);
            }
        }

        return null;
    }

    /**
     * Stable semver tags only (no nightlies, RCs, or drafts). Used by the roadmap.
     *
     * @return list<string>
     */
    public function publishedVersions(): array
    {
        return Cache::remember(self::CACHE_VERSIONS, $this->cacheTtl(), function () {
            $versions = [];

            foreach ($this->cachedReleases() as $release) {
                if (($release['prerelease'] ?? false) === true) {
                    continue;
                }

                $tag = $this->versionDisplay((string) $release['tag_name']);
                if ($this->isPrereleaseTag($tag)) {
                    continue;
                }
                if (! preg_match('/^\d+\.\d+\.\d+$/', $tag)) {
                    continue;
                }

                $versions[] = $tag;
            }

            return array_values(array_unique($versions));
        });
    }

    /**
     * Releases that ship a CycloneDX SBOM asset, newest first.
     *
     * @return list<array{version: string, tag: string, publishedAt: string, isPrerelease: bool, releaseUrl: string, sbomUrl: string}>
     */
    public function sbomReleases(): array
    {
        if ($this->sbomReleasesMemo !== null) {
            return $this->sbomReleasesMemo;
        }

        $out = [];

        foreach ($this->cachedReleases() as $release) {
            $sbomUrl = $this->sbomUrlFromAssets($release['assets'] ?? []);
            if ($sbomUrl === null) {
                continue;
            }

            $tag = (string) $release['tag_name'];
            $out[] = [
                'version' => $this->versionDisplay($tag),
                'tag' => $tag,
                'publishedAt' => (string) $release['published_at'],
                'isPrerelease' => ((bool) ($release['prerelease'] ?? false)) || $this->isPrereleaseTag($tag),
                'releaseUrl' => (string) $release['html_url'],
                'sbomUrl' => $sbomUrl,
            ];
        }

        usort($out, function (array $a, array $b): int {
            $byDate = strcmp($b['publishedAt'], $a['publishedAt']);
            if ($byDate !== 0) {
                return $byDate;
            }

            return $this->compareVersionDesc($a['tag'], $b['tag']);
        });

        return $this->sbomReleasesMemo = $out;
    }

    /**
     * @param  list<array{name?: string, browser_download_url?: string}|mixed>  $assets
     */
    private function sbomUrlFromAssets(array $assets): ?string
    {
        foreach ($assets as $asset) {
            if (! is_array($asset)) {
                continue;
            }
            $name = $asset['name'] ?? null;
            $url = $asset['browser_download_url'] ?? null;
            if (! is_string($name) || ! is_string($url)) {
                continue;
            }
            if (preg_match('/sbom\.cyclonedx\.json$/i', $name)) {
                return $url;
            }
        }

        return null;
    }

    private function cacheTtl(): int
    {
        return max(60, min((int) config('meshchatx.releases_cache_seconds', 3600), 86400));
    }

    /**
     * Shared release list for payload + versions. Fresh miss falls back to a longer-lived stale copy
     * so rate limits or GitHub outages do not wipe the site.
     *
     * @return list<array<string, mixed>>
     */
    private function cachedReleases(): array
    {
        if ($this->releasesMemo !== null) {
            return $this->releasesMemo;
        }

        $ttl = $this->cacheTtl();
        $cached = Cache::get(self::CACHE_RAW);
        if (is_array($cached)) {
            return $this->releasesMemo = $cached;
        }

        try {
            return $this->releasesMemo = Cache::lock('meshchatx.releases.fetch', 25)
                ->block(10, function () use ($ttl) {
                    $cached = Cache::get(self::CACHE_RAW);
                    if (is_array($cached)) {
                        return $cached;
                    }

                    $fresh = $this->fetchReleases();
                    if ($fresh !== []) {
                        Cache::put(self::CACHE_RAW, $fresh, $ttl);
                        Cache::put(self::CACHE_RAW_STALE, $fresh, max($ttl * 12, 43200));

                        return $fresh;
                    }

                    $stale = Cache::get(self::CACHE_RAW_STALE);
                    if (is_array($stale) && $stale !== []) {
                        Cache::put(self::CACHE_RAW, $stale, min(300, $ttl));

                        return $stale;
                    }

                    Cache::put(self::CACHE_RAW, [], 60);

                    return [];
                });
        } catch (LockTimeoutException) {
            $stale = Cache::get(self::CACHE_RAW_STALE);
            if (is_array($stale) && $stale !== []) {
                return $this->releasesMemo = $stale;
            }

            return $this->releasesMemo = [];
        }
    }

    /**
     * @return array{
     *     stable: ?array<string, mixed>,
     *     beta: ?array<string, mixed>,
     *     testing: ?array<string, mixed>,
     *     prerelease: ?array<string, mixed>,
     *     githubFallbackUrl: string,
     *     versions: array{
     *         stable: list<array{tag: string, version: string, publishedAt: string}>,
     *         beta: list<array{tag: string, version: string, publishedAt: string}>,
     *         testing: list<array{tag: string, version: string, publishedAt: string}>,
     *         prerelease: list<array{tag: string, version: string, publishedAt: string}>
     *     }
     * }
     */
    private function buildPayload(): array
    {
        $fallback = (string) config('meshchatx.github_releases');
        $releases = $this->cachedReleases();
        $testingVersions = $this->versionsForChannel('testing');
        $versions = [
            'stable' => $this->versionsForChannel('stable'),
            'beta' => $this->versionsForChannel('beta'),
            'testing' => $testingVersions,
            'prerelease' => $testingVersions,
        ];

        if ($releases === []) {
            return [
                'stable' => null,
                'beta' => null,
                'testing' => null,
                'prerelease' => null,
                'githubFallbackUrl' => $fallback,
                'versions' => $versions,
            ];
        }

        $stable = $this->pickLatestForChannel($releases, 'stable');
        $beta = $this->pickLatestForChannel($releases, 'beta');
        $testing = $this->pickLatestForChannel($releases, 'testing');
        $testingRow = $testing ? $this->rowFromRelease($testing) : null;

        return [
            'stable' => $stable ? $this->rowFromRelease($stable) : null,
            'beta' => $beta ? $this->rowFromRelease($beta) : null,
            'testing' => $testingRow,
            'prerelease' => $testingRow,
            'githubFallbackUrl' => $fallback,
            'versions' => $versions,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fetchReleases(): array
    {
        $fromApi = $this->fetchFromApi();
        if ($fromApi !== []) {
            return $fromApi;
        }

        return $this->fetchFromAtom();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fetchFromApi(): array
    {
        $repo = config('meshchatx.github_repo');
        $url = "https://api.github.com/repos/{$repo}/releases?per_page=100";

        try {
            $request = Http::timeout(15)
                ->withHeaders([
                    'Accept' => 'application/vnd.github+json',
                    'X-GitHub-Api-Version' => '2022-11-28',
                    'User-Agent' => 'meshchatx-website',
                ]);

            $token = trim((string) config('services.github.token', ''));
            if ($token !== '') {
                $request = $request->withToken($token);
            }

            $response = $request->get($url);
            if (! $response->successful()) {
                return [];
            }

            $data = $response->json();
            if (! is_array($data)) {
                return [];
            }

            $out = [];
            foreach ($data as $item) {
                if (! is_array($item) || ($item['draft'] ?? false) === true) {
                    continue;
                }
                $tag = $item['tag_name'] ?? null;
                $published = $item['published_at'] ?? null;
                $htmlUrl = $item['html_url'] ?? null;
                if (! is_string($tag) || ! is_string($published) || ! is_string($htmlUrl)) {
                    continue;
                }

                $assets = [];
                foreach ($item['assets'] ?? [] as $asset) {
                    if (! is_array($asset)) {
                        continue;
                    }
                    $name = $asset['name'] ?? null;
                    $download = $asset['browser_download_url'] ?? null;
                    if (! is_string($name) || ! is_string($download)) {
                        continue;
                    }
                    $digest = $asset['digest'] ?? null;
                    $assets[] = [
                        'name' => $name,
                        'browser_download_url' => $download,
                        'sha256' => is_string($digest) ? $this->normalizeSha256($digest) : null,
                    ];
                }

                $out[] = [
                    'tag_name' => $tag,
                    'published_at' => $published,
                    'prerelease' => ($item['prerelease'] ?? false) === true,
                    'html_url' => $htmlUrl,
                    'assets' => $assets,
                ];
            }

            return $out;
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fetchFromAtom(): array
    {
        $url = (string) config('meshchatx.github_releases_atom');

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Accept' => 'application/atom+xml',
                    'User-Agent' => 'meshchatx-website',
                ])
                ->get($url);

            if (! $response->successful()) {
                return [];
            }

            $xml = $response->body();
            $out = [];
            if (preg_match_all('/<entry>([\s\S]*?)<\/entry>/', $xml, $entries)) {
                foreach ($entries[1] as $block) {
                    if (! preg_match('/<updated>([^<]+)<\/updated>/', $block, $updated)) {
                        continue;
                    }
                    if (! preg_match('/\/releases\/tag\/([^"]+)/', $block, $href)) {
                        continue;
                    }
                    $tag = $href[1];
                    $iso = trim($updated[1]);
                    $out[] = [
                        'tag_name' => $tag,
                        'published_at' => $iso,
                        'prerelease' => $this->isPrereleaseTag($tag),
                        'html_url' => config('meshchatx.github_releases').'/tag/'.rawurlencode($tag),
                        'assets' => [],
                    ];
                }
            }

            return $out;
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @param  list<array<string, mixed>>  $releases
     * @return ?array<string, mixed>
     */
    private function pickLatestForChannel(array $releases, string $channel): ?array
    {
        $channel = $this->normalizeChannel($channel);
        $filtered = array_values(array_filter(
            $releases,
            fn (array $r): bool => $this->channelForTag(
                (string) $r['tag_name'],
                (bool) ($r['prerelease'] ?? false),
            ) === $channel
        ));

        if ($filtered === []) {
            return null;
        }

        usort($filtered, function (array $a, array $b): int {
            $byDate = strcmp((string) $b['published_at'], (string) $a['published_at']);
            if ($byDate !== 0) {
                return $byDate;
            }

            return $this->compareVersionDesc(
                (string) $a['tag_name'],
                (string) $b['tag_name']
            );
        });

        return array_first($filtered);
    }

    private function compareVersionDesc(string $a, string $b): int
    {
        return version_compare(
            $this->versionDisplay($b),
            $this->versionDisplay($a),
        );
    }

    private function versionDisplay(string $tag): string
    {
        return (string) (preg_replace('/^v/i', '', $tag) ?? $tag);
    }

    private function isPrereleaseTag(string $tag): bool
    {
        $n = $this->versionDisplay($tag);
        if (preg_match('/-(rc|alpha|beta|pre)(\.|\d|$)/i', $n)) {
            return true;
        }
        if (preg_match('/\d(rc|alpha|beta|pre)(\.|\d|$)/i', $n)) {
            return true;
        }
        if (preg_match('/\.(rc|alpha|beta|pre)\d/i', $n)) {
            return true;
        }
        if (preg_match('/snapshot|nightly|canary|(^|[-.\/_])dev($|[-.\/_\d])/i', $n)) {
            return true;
        }

        return false;
    }

    /**
     * Normalize GitHub asset digests (sha256:hex) or bare hex to lowercase hex.
     */
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

    /**
     * @param  array<string, mixed>  $release
     * @return array<string, mixed>
     */
    private function rowFromRelease(array $release): array
    {
        $tag = (string) $release['tag_name'];
        $githubFiles = [];
        foreach ($release['assets'] as $asset) {
            $sha = $asset['sha256'] ?? null;
            $githubFiles[] = [
                'base' => (string) $asset['name'],
                'url' => (string) $asset['browser_download_url'],
                'sha256' => is_string($sha) ? $this->normalizeSha256($sha) : null,
            ];
        }

        $bunnyFiles = $this->bunnyFilesForTag($githubFiles, $tag);

        $version = $this->versionDisplay($tag);
        $githubPre = (bool) $release['prerelease'];
        $channel = $this->channelForTag($tag, $githubPre);
        $isPre = $channel !== 'stable';
        $githubUrls = $this->matchFileUrls($githubFiles, $version, $githubPre);
        $bunnyUrls = $bunnyFiles === []
            ? []
            : $this->matchFileUrls($bunnyFiles, $version, $githubPre);

        $servers = [];
        if ($this->hasDownloadableUrl($bunnyUrls)) {
            $servers[] = 'bunny';
        }
        if ($this->hasDownloadableUrl($githubUrls)) {
            $servers[] = 'github';
        }

        $preferred = in_array('bunny', $servers, true) ? 'bunny' : 'github';
        $urls = $preferred === 'bunny' && $bunnyUrls !== [] ? $bunnyUrls : $githubUrls;

        return array_merge([
            'version' => $version,
            'tag' => $tag,
            'releaseUrl' => (string) $release['html_url'],
            'publishedAt' => (string) $release['published_at'],
            'channel' => $channel,
            'isPrerelease' => $isPre,
            'downloadServer' => $preferred,
            'downloadServers' => $servers,
            'assetsByServer' => [
                'bunny' => $bunnyUrls,
                'github' => $githubUrls,
            ],
        ], $urls);
    }

    /**
     * Apply a concrete download server onto a release row's flat URL fields.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public function withDownloadServer(array $row, ?string $source): array
    {
        $servers = $row['downloadServers'] ?? [];
        if (! is_array($servers)) {
            $servers = [];
        }
        $servers = array_values(array_filter(
            $servers,
            static fn (mixed $s): bool => $s === 'bunny' || $s === 'github',
        ));

        $chosen = is_string($source) ? $source : '';
        if (! in_array($chosen, $servers, true)) {
            $chosen = in_array('bunny', $servers, true)
                ? 'bunny'
                : (string) ($servers[0] ?? 'github');
        }

        $bundle = $row['assetsByServer'][$chosen] ?? null;
        if (is_array($bundle) && $bundle !== []) {
            $row = array_merge($row, $bundle);
        }

        $row['downloadServer'] = $chosen;
        $row['downloadServers'] = $servers;

        return $row;
    }

    /**
     * @param  list<array{base: string, url: string, sha256: ?string}>  $githubFiles
     * @return list<array{base: string, url: string, sha256: ?string}>
     */
    private function bunnyFilesForTag(array $githubFiles, string $tag): array
    {
        $bunny = $this->bunny->assetsByName($tag);
        if ($bunny === []) {
            return [];
        }

        if ($githubFiles === []) {
            $out = [];
            foreach ($bunny as $asset) {
                $out[] = [
                    'base' => $asset['name'],
                    'url' => $asset['url'],
                    'sha256' => $asset['sha256'],
                ];
            }

            return $out;
        }

        $out = [];
        foreach ($githubFiles as $file) {
            $hit = $bunny[strtolower($file['base'])] ?? null;
            if (! is_array($hit)) {
                continue;
            }
            $sha = $hit['sha256'] ?? null;
            $out[] = [
                'base' => $file['base'],
                'url' => $hit['url'],
                'sha256' => is_string($sha) && $sha !== '' ? $sha : $file['sha256'],
            ];
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $urls
     */
    private function hasDownloadableUrl(array $urls): bool
    {
        foreach ($urls as $key => $value) {
            if (! is_string($key) || ! str_ends_with($key, 'Url')) {
                continue;
            }
            if (is_string($value) && $value !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<array{base: string, url: string, sha256: ?string}>  $files
     * @return array<string, ?string>
     */
    private function matchFileUrls(array $files, string $versionDisplay, bool $isPrerelease): array
    {
        /**
         * @return ?array{url: string, sha256: ?string}
         */
        $byBase = function (callable $pred) use ($files): ?array {
            $match = array_find(
                $files,
                fn (array $file): bool => $pred(strtolower($file['base'])),
            );

            if (! is_array($match)) {
                return null;
            }

            return [
                'url' => $match['url'],
                'sha256' => $match['sha256'],
            ];
        };

        $urlOf = static fn (?array $hit): ?string => is_array($hit) ? $hit['url'] : null;
        $shaOf = static fn (?array $hit): ?string => is_array($hit) ? $hit['sha256'] : null;

        $notMacWinAppImage = fn (string $n): bool => str_ends_with($n, '.appimage')
            && ! preg_match('/(darwin|macos|\bmac\b|windows|\bwin\b)/i', $n);

        $appImageAmd64 = $byBase(fn (string $n): bool => str_ends_with($n, '.appimage')
            && str_contains($n, 'linux')
            && preg_match('/(amd64|x86_64)/', $n)
            && ! preg_match('/(arm64|aarch64)/', $n))
            ?? $byBase(fn (string $n): bool => str_ends_with($n, '.appimage')
                && str_contains($n, 'linux')
                && ! preg_match('/(amd64|x86_64|arm64|aarch64)/', $n))
            ?? $byBase(fn (string $n): bool => $notMacWinAppImage($n)
                && preg_match('/(amd64|x86_64)/', $n)
                && ! preg_match('/(arm64|aarch64)/', $n));

        $appImageArm64 = $byBase(fn (string $n): bool => str_ends_with($n, '.appimage')
            && str_contains($n, 'linux')
            && preg_match('/(arm64|aarch64)/', $n))
            ?? $byBase(fn (string $n): bool => $notMacWinAppImage($n)
                && preg_match('/(arm64|aarch64)/', $n)
                && ! preg_match('/(amd64|x86_64)/', $n));

        $wheel = array_find(
            $files,
            fn (array $file): bool => (bool) preg_match('/-py3-none-any\.whl$/i', $file['base']),
        ) ?? array_find(
            $files,
            fn (array $file): bool => str_ends_with(strtolower($file['base']), '.whl'),
        );
        $wheelHit = is_array($wheel)
            ? ['url' => $wheel['url'], 'sha256' => $wheel['sha256']]
            : null;
        $wheelBase = is_array($wheel) ? $wheel['base'] : null;

        $macDmg = $byBase(fn (string $n): bool => str_ends_with($n, '.dmg')
            && ! str_ends_with($n, '.dmg.sha256')
            && ! str_contains($n, '.cosign.'));
        if ($macDmg === null && $isPrerelease && is_string($wheelBase)) {
            if (preg_match('/^reticulum_meshchatx-([\d.]+)-py3-none-any\.whl$/i', $wheelBase, $m)) {
                $guess = strtolower("ReticulumMeshChatX-v{$m[1]}-mac-universal.dmg");
                $macDmg = $byBase(fn (string $n): bool => $n === $guess);
            }
        }
        if ($macDmg === null && $isPrerelease && preg_match('/^(\d+\.\d+\.\d+)/', $versionDisplay, $m)) {
            $guess = strtolower("ReticulumMeshChatX-v{$m[1]}-mac-universal.dmg");
            $macDmg = $byBase(fn (string $n): bool => $n === $guess);
        }

        $winInstaller = array_find(
            $files,
            fn (array $file): bool => (bool) preg_match('/win.*installer\.exe$/i', $file['base']),
        );
        $winPortable = array_find(
            $files,
            fn (array $file): bool => (bool) preg_match('/win.*portable\.exe$/i', $file['base']),
        );
        $winInstallerHit = is_array($winInstaller)
            ? ['url' => $winInstaller['url'], 'sha256' => $winInstaller['sha256']]
            : null;
        $winPortableHit = is_array($winPortable)
            ? ['url' => $winPortable['url'], 'sha256' => $winPortable['sha256']]
            : null;

        $debAmd64 = $byBase(fn (string $n): bool => str_ends_with($n, '.deb') && preg_match('/(amd64|x86_64)/', $n));
        $debArm64 = $byBase(fn (string $n): bool => str_ends_with($n, '.deb') && preg_match('/(arm64|aarch64)/', $n));
        $rpmAmd64 = $byBase(fn (string $n): bool => str_ends_with($n, '.rpm') && preg_match('/(amd64|x86_64)/', $n));
        $apk = $byBase(fn (string $n): bool => str_ends_with($n, '.apk')
            && ! str_contains($n, 'alpine')
            && ! str_contains($n, 'linux'));
        $alpineApk = $byBase(fn (string $n): bool => str_ends_with($n, '.apk')
            && str_contains($n, 'alpine'));
        $flatpak = $byBase(fn (string $n): bool => str_ends_with($n, '.flatpak'));
        $sbom = $byBase(fn (string $n): bool => (bool) preg_match('/sbom\.cyclonedx\.json$/i', $n));

        return [
            'appImageAmd64Url' => $urlOf($appImageAmd64),
            'appImageAmd64Sha256' => $shaOf($appImageAmd64),
            'appImageArm64Url' => $urlOf($appImageArm64),
            'appImageArm64Sha256' => $shaOf($appImageArm64),
            'debAmd64Url' => $urlOf($debAmd64),
            'debAmd64Sha256' => $shaOf($debAmd64),
            'debArm64Url' => $urlOf($debArm64),
            'debArm64Sha256' => $shaOf($debArm64),
            'rpmAmd64Url' => $urlOf($rpmAmd64),
            'rpmAmd64Sha256' => $shaOf($rpmAmd64),
            'wheelUrl' => $urlOf($wheelHit),
            'wheelSha256' => $shaOf($wheelHit),
            'winInstallerUrl' => $urlOf($winInstallerHit),
            'winInstallerSha256' => $shaOf($winInstallerHit),
            'winPortableUrl' => $urlOf($winPortableHit),
            'winPortableSha256' => $shaOf($winPortableHit),
            'macDmgUrl' => $urlOf($macDmg),
            'macDmgSha256' => $shaOf($macDmg),
            'apkUrl' => $urlOf($apk),
            'apkSha256' => $shaOf($apk),
            'alpineApkUrl' => $urlOf($alpineApk),
            'alpineApkSha256' => $shaOf($alpineApk),
            'flatpakUrl' => $urlOf($flatpak),
            'flatpakSha256' => $shaOf($flatpak),
            'sbomUrl' => $urlOf($sbom),
            'sbomSha256' => $shaOf($sbom),
        ];
    }
}
