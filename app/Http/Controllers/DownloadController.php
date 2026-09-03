<?php

namespace App\Http\Controllers;

use App\Services\GithubReleasesService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DownloadController extends Controller
{
    public function __invoke(Request $request, GithubReleasesService $releases): View
    {
        $channel = $request->query('channel') === 'prerelease'
            ? 'prerelease'
            : 'stable';

        $payload = $releases->payload();
        $versions = $releases->versionsForChannel($channel === 'prerelease');
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
            $active = $channel === 'prerelease'
                ? ($payload['prerelease'] ?? $payload['stable'] ?? null)
                : ($payload['stable'] ?? $payload['prerelease'] ?? null);
        }

        if (is_array($active)) {
            $active = $releases->withDownloadServer($active, $requestedSource !== '' ? $requestedSource : null);
        }

        $pre = $payload['prerelease'] ?? null;
        if (is_array($pre) && is_array($active)) {
            $pre = $releases->withDownloadServer($pre, (string) ($active['downloadServer'] ?? ''));
        } elseif (is_array($pre)) {
            $pre = $releases->withDownloadServer($pre, $requestedSource !== '' ? $requestedSource : null);
        }

        if (is_array($payload['stable'] ?? null)) {
            $payload['stable'] = $releases->withDownloadServer(
                $payload['stable'],
                is_array($active) ? (string) ($active['downloadServer'] ?? '') : null,
            );
        }
        if (is_array($payload['prerelease'] ?? null)) {
            $payload['prerelease'] = $pre;
        }

        return view('pages.download', [
            'releases' => $payload,
            'channel' => $channel,
            'versions' => $versions,
            'active' => $active,
            'selectedTag' => is_array($active) ? (string) ($active['tag'] ?? $active['version'] ?? '') : '',
            'selectedSource' => is_array($active) ? (string) ($active['downloadServer'] ?? 'github') : 'github',
            'downloadServers' => is_array($active) && is_array($active['downloadServers'] ?? null)
                ? $active['downloadServers']
                : [],
        ]);
    }

    /**
     * @param  array<string, mixed>  $release
     */
    private function releaseMatchesChannel(array $release, string $channel): bool
    {
        $isPre = ($release['isPrerelease'] ?? false) === true;

        return $channel === 'prerelease' ? $isPre : ! $isPre;
    }
}
