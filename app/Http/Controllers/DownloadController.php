<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DownloadController extends Controller
{
    public function __invoke(Request $request, GithubReleasesService $releases): View
    {
        $channel = $releases->normalizeChannel($request->query('channel'));

        $payload = $releases->payload();
        $versions = $releases->versionsForChannel($channel);
        $requested = trim((string) $request->query('v', ''));
        $requestedSource = trim((string) $request->query('source', ''));

        $active = null;
        if ($requested !== '') {
            $match = $releases->releaseForTag($requested);
            if (is_array($match) && $this->releaseMatchesChannel($match, $channel)) {
                $active = $match;
            }
        }

        if ($active === null) {
            $active = is_array($payload[$channel] ?? null) ? $payload[$channel] : null;
        }

        if (is_array($active)) {
            $active = $releases->withDownloadServer($active, $requestedSource !== '' ? $requestedSource : null);
        }

        $sourceForChannels = is_array($active)
            ? (string) ($active['downloadServer'] ?? '')
            : ($requestedSource !== '' ? $requestedSource : null);

        foreach (GithubReleasesService::CHANNELS as $name) {
            if (is_array($payload[$name] ?? null)) {
                $payload[$name] = $releases->withDownloadServer($payload[$name], $sourceForChannels);
            }
        }
        $payload['prerelease'] = $payload['testing'] ?? null;

        return view('pages.download', [
            'releases' => $payload,
            'channel' => $channel,
            'versions' => $versions,
            'active' => $active,
            'detectedPlatform' => $this->detectPlatform((string) $request->userAgent()),
            'selectedTag' => is_array($active) ? (string) ($active['tag'] ?? $active['version'] ?? '') : '',
            'selectedSource' => is_array($active) ? (string) ($active['downloadServer'] ?? 'github') : 'github',
            'downloadServers' => is_array($active) && is_array($active['downloadServers'] ?? null)
                ? $active['downloadServers']
                : [],
        ]);
    }

    /**
     * Mirror of detectDownloadPlatform in resources/js/app.js so the first paint
     * already shows the visitor's platform panel instead of swapping it later.
     */
    private function detectPlatform(string $ua): string
    {
        return match (true) {
            preg_match('/android/i', $ua) === 1 => 'android',
            preg_match('/iphone|ipad|ipod/i', $ua) === 1 => 'macos',
            preg_match('/win/i', $ua) === 1 => 'windows',
            preg_match('/mac/i', $ua) === 1 => 'macos',
            preg_match('/linux|cros|x11/i', $ua) === 1 => 'linux',
            default => 'linux',
        };
    }

    /**
     * @param  array<string, mixed>  $release
     */
    private function releaseMatchesChannel(array $release, string $channel): bool
    {
        $releaseChannel = (string) ($release['channel'] ?? '');
        if ($releaseChannel !== '') {
            return $releaseChannel === $channel;
        }

        return $channel === 'stable'
            ? ($release['isPrerelease'] ?? false) !== true
            : ($release['isPrerelease'] ?? false) === true;
    }
}
