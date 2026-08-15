<?php

namespace Tests\Unit;

use App\Services\GithubReleasesService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GithubReleasesServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_prerelease_channel_picks_newest_nightly_over_older_rc(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'nightly-2026.08.04-af76f09',
                    'published_at' => '2026-08-04T12:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/nightly-2026.08.04-af76f09',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.2-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/nightly.AppImage',
                        ],
                        [
                            'name' => 'app-release-signed.apk',
                            'browser_download_url' => 'https://example.test/nightly.apk',
                        ],
                    ],
                ],
                [
                    'tag_name' => 'v4.8.1',
                    'published_at' => '2026-07-25T22:30:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.1',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.1-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/stable.AppImage',
                        ],
                    ],
                ],
                [
                    'tag_name' => 'v4.7.1-rc.1',
                    'published_at' => '2026-06-21T21:51:04Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.7.1-rc.1',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.7.1-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/rc.AppImage',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertSame('4.8.1', $payload['stable']['version'] ?? null);
        $this->assertSame('nightly-2026.08.04-af76f09', $payload['prerelease']['version'] ?? null);
        $this->assertTrue($payload['prerelease']['isPrerelease'] ?? false);
        $this->assertSame('https://example.test/nightly.AppImage', $payload['prerelease']['appImageAmd64Url'] ?? null);
        $this->assertSame('https://example.test/nightly.apk', $payload['prerelease']['apkUrl'] ?? null);
    }

    public function test_release_assets_map_wheel_alpine_android_dmg_and_sbom(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'v4.8.3',
                    'published_at' => '2026-08-14T22:54:57Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.3',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-linux-alpine-x64.apk',
                            'browser_download_url' => 'https://example.test/alpine.apk',
                        ],
                        [
                            'name' => 'app-release-signed.apk',
                            'browser_download_url' => 'https://example.test/android.apk',
                        ],
                        [
                            'name' => 'reticulum_meshchatx-4.8.3-py3-none-any.whl',
                            'browser_download_url' => 'https://example.test/meshchatx.whl',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-mac-universal.dmg',
                            'browser_download_url' => 'https://example.test/mac.dmg',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-mac-universal.dmg.cosign.bundle',
                            'browser_download_url' => 'https://example.test/mac.dmg.cosign.bundle',
                        ],
                        [
                            'name' => 'sbom.cyclonedx.json',
                            'browser_download_url' => 'https://example.test/sbom.cyclonedx.json',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $stable = app(GithubReleasesService::class)->payload()['stable'] ?? null;

        $this->assertIsArray($stable);
        $this->assertSame('https://example.test/meshchatx.whl', $stable['wheelUrl'] ?? null);
        $this->assertSame('https://example.test/alpine.apk', $stable['alpineApkUrl'] ?? null);
        $this->assertSame('https://example.test/android.apk', $stable['apkUrl'] ?? null);
        $this->assertSame('https://example.test/mac.dmg', $stable['macDmgUrl'] ?? null);
        $this->assertSame('https://example.test/sbom.cyclonedx.json', $stable['sbomUrl'] ?? null);
        $this->assertNotSame($stable['apkUrl'], $stable['alpineApkUrl']);
    }

    public function test_prerelease_channel_includes_dev_tagged_releases(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'dev-2026.08.05',
                    'published_at' => '2026-08-05T08:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/dev-2026.08.05',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.9.0-win-installer.exe',
                            'browser_download_url' => 'https://example.test/dev-win.exe',
                        ],
                    ],
                ],
                [
                    'tag_name' => 'v4.8.0-beta.1',
                    'published_at' => '2026-08-01T00:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.0-beta.1',
                    'assets' => [],
                ],
            ], 200),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertNull($payload['stable']);
        $this->assertSame('dev-2026.08.05', $payload['prerelease']['version'] ?? null);
        $this->assertSame('https://example.test/dev-win.exe', $payload['prerelease']['winInstallerUrl'] ?? null);
    }

    public function test_atom_fallback_marks_nightly_and_dev_as_prerelease(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response('rate limited', 403),
            'github.com/*/releases.atom' => Http::response(<<<'ATOM'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <updated>2026-08-04T12:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/Quad4-Software/MeshChatX/releases/tag/nightly-2026.08.04-af76f09"/>
  </entry>
  <entry>
    <updated>2026-08-03T12:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/Quad4-Software/MeshChatX/releases/tag/dev-2026.08.03"/>
  </entry>
  <entry>
    <updated>2026-07-25T22:30:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.1"/>
  </entry>
</feed>
ATOM, 200),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertSame('4.8.1', $payload['stable']['version'] ?? null);
        $this->assertSame('nightly-2026.08.04-af76f09', $payload['prerelease']['version'] ?? null);
        $this->assertTrue($payload['prerelease']['isPrerelease'] ?? false);
    }

    public function test_published_versions_exclude_prereleases_and_share_raw_cache(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'nightly-2026.08.04-af76f09',
                    'published_at' => '2026-08-04T12:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/nightly-2026.08.04-af76f09',
                    'assets' => [],
                ],
                [
                    'tag_name' => 'v4.8.1',
                    'published_at' => '2026-07-25T22:30:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.1',
                    'assets' => [],
                ],
                [
                    'tag_name' => 'v4.7.1-rc.1',
                    'published_at' => '2026-06-21T21:51:04Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.7.1-rc.1',
                    'assets' => [],
                ],
                [
                    'tag_name' => 'v4.8.0',
                    'published_at' => '2026-07-20T00:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.0',
                    'assets' => [],
                ],
            ], 200),
        ]);

        $service = app(GithubReleasesService::class);
        $versions = $service->publishedVersions();
        $payload = $service->payload();

        $this->assertSame(['4.8.1', '4.8.0'], $versions);
        $this->assertSame('4.8.1', $payload['stable']['version'] ?? null);
        Http::assertSentCount(1);
    }

    public function test_stale_releases_are_served_when_github_fails(): void
    {
        Cache::put('meshchatx.releases.raw.stale', [
            [
                'tag_name' => 'v4.8.1',
                'published_at' => '2026-07-25T22:30:00Z',
                'prerelease' => false,
                'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.1',
                'assets' => [],
            ],
        ], 3600);

        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response('rate limited', 403),
            'github.com/*/releases.atom' => Http::response('fail', 500),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertSame('4.8.1', $payload['stable']['version'] ?? null);
    }
}
