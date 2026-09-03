<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GithubReleasesService
{
    private const CACHE_RAW = 'meshchatx.releases.raw';

    private const CACHE_RAW_STALE = 'meshchatx.releases.raw.stale';

    private const CACHE_PAYLOAD = 'meshchatx.releases.payload';

    private const CACHE_VERSIONS = 'meshchatx.releases.versions';

    /**
     * @return array{stable: ?array<string, mixed>, prerelease: ?array<string, mixed>, githubFallbackUrl: string}
     */
    public function payload(): array
    {
        return Cache::remember(self::CACHE_PAYLOAD, $this->cacheTtl(), fn () => $this->buildPayload());
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

        return $out;
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
        $ttl = $this->cacheTtl();
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
    }

    /**
     * @return array{stable: ?array<string, mixed>, prerelease: ?array<string, mixed>, githubFallbackUrl: string}
     */
    private function buildPayload(): array
    {
        $fallback = (string) config('meshchatx.github_releases');
        $releases = $this->cachedReleases();

        if ($releases === []) {
            return [
                'stable' => null,
                'prerelease' => null,
                'githubFallbackUrl' => $fallback,
            ];
        }

        $stable = $this->pickLatest($releases, false);
        $pre = $this->pickLatest($releases, true);

        return [
            'stable' => $stable ? $this->rowFromRelease($stable) : null,
            'prerelease' => $pre ? $this->rowFromRelease($pre) : null,
            'githubFallbackUrl' => $fallback,
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
                    if (is_string($name) && is_string($download)) {
                        $assets[] = ['name' => $name, 'browser_download_url' => $download];
                    }
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
    private function pickLatest(array $releases, bool $wantPrerelease): ?array
    {
        $filtered = array_values(array_filter(
            $releases,
            fn (array $r): bool => ((bool) $r['prerelease']) === $wantPrerelease
        ));

        if ($filtered === []) {
            return null;
        }

        // Nightly/dev tags are not semver. Prefer published_at so the newest
        // GitHub pre-release (nightly, RC, alpha, beta, canary) wins.
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
     * @param  array<string, mixed>  $release
     * @return array<string, mixed>
     */
    private function rowFromRelease(array $release): array
    {
        $files = [];
        foreach ($release['assets'] as $asset) {
            $files[] = [
                'base' => (string) $asset['name'],
                'url' => (string) $asset['browser_download_url'],
            ];
        }

        $version = $this->versionDisplay((string) $release['tag_name']);
        $isPre = (bool) $release['prerelease'];
        $urls = $this->matchFileUrls($files, $version, $isPre);

        return array_merge([
            'version' => $version,
            'releaseUrl' => (string) $release['html_url'],
            'publishedAt' => (string) $release['published_at'],
            'isPrerelease' => $isPre,
        ], $urls);
    }

    /**
     * @param  list<array{base: string, url: string}>  $files
     * @return array<string, ?string>
     */
    private function matchFileUrls(array $files, string $versionDisplay, bool $isPrerelease): array
    {
        $byBase = function (callable $pred) use ($files): ?string {
            $match = array_find(
                $files,
                fn (array $file): bool => $pred(strtolower($file['base'])),
            );

            return is_array($match) ? $match['url'] : null;
        };

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
        $wheelUrl = is_array($wheel) ? $wheel['url'] : null;
        $wheelBase = is_array($wheel) ? $wheel['base'] : null;

        $macDmgUrl = $byBase(fn (string $n): bool => str_ends_with($n, '.dmg') && ! str_ends_with($n, '.dmg.sha256'));
        if ($macDmgUrl === null && $isPrerelease && is_string($wheelBase)) {
            if (preg_match('/^reticulum_meshchatx-([\d.]+)-py3-none-any\.whl$/i', $wheelBase, $m)) {
                $guess = strtolower("ReticulumMeshChatX-v{$m[1]}-mac-universal.dmg");
                $macDmgUrl = $byBase(fn (string $n): bool => $n === $guess);
            }
        }
        if ($macDmgUrl === null && $isPrerelease && preg_match('/^(\d+\.\d+\.\d+)/', $versionDisplay, $m)) {
            $guess = strtolower("ReticulumMeshChatX-v{$m[1]}-mac-universal.dmg");
            $macDmgUrl = $byBase(fn (string $n): bool => $n === $guess);
        }

        $winInstaller = array_find(
            $files,
            fn (array $file): bool => (bool) preg_match('/win.*installer\.exe$/i', $file['base']),
        );
        $winPortable = array_find(
            $files,
            fn (array $file): bool => (bool) preg_match('/win.*portable\.exe$/i', $file['base']),
        );

        return [
            'appImageAmd64Url' => $appImageAmd64,
            'appImageArm64Url' => $appImageArm64,
            'debAmd64Url' => $byBase(fn (string $n): bool => str_ends_with($n, '.deb') && preg_match('/(amd64|x86_64)/', $n)),
            'debArm64Url' => $byBase(fn (string $n): bool => str_ends_with($n, '.deb') && preg_match('/(arm64|aarch64)/', $n)),
            'rpmAmd64Url' => $byBase(fn (string $n): bool => str_ends_with($n, '.rpm') && preg_match('/(amd64|x86_64)/', $n)),
            'wheelUrl' => $wheelUrl,
            'winInstallerUrl' => is_array($winInstaller) ? $winInstaller['url'] : null,
            'winPortableUrl' => is_array($winPortable) ? $winPortable['url'] : null,
            'macDmgUrl' => $macDmgUrl,
            'apkUrl' => $byBase(fn (string $n): bool => str_ends_with($n, '.apk')
                && ! str_contains($n, 'alpine')
                && ! str_contains($n, 'linux')),
            'alpineApkUrl' => $byBase(fn (string $n): bool => str_ends_with($n, '.apk')
                && str_contains($n, 'alpine')),
            'flatpakUrl' => $byBase(fn (string $n): bool => str_ends_with($n, '.flatpak')),
            'sbomUrl' => $byBase(fn (string $n): bool => (bool) preg_match('/sbom\.cyclonedx\.json$/i', $n)),
        ];
    }
}
