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
        config(['services.bunny.access_key' => '']);
    }

    public function test_testing_channel_picks_newest_nightly_over_older_rc(): void
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
                [
                    'tag_name' => 'beta-2026.08.01-abcdef0',
                    'published_at' => '2026-08-01T10:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/beta-2026.08.01-abcdef0',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.2-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/beta.AppImage',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertSame('4.8.1', $payload['stable']['version'] ?? null);
        $this->assertSame('beta-2026.08.01-abcdef0', $payload['beta']['version'] ?? null);
        $this->assertSame('nightly-2026.08.04-af76f09', $payload['testing']['version'] ?? null);
        $this->assertSame($payload['testing'], $payload['prerelease']);
        $this->assertTrue($payload['testing']['isPrerelease'] ?? false);
        $this->assertSame('testing', $payload['testing']['channel'] ?? null);
        $this->assertSame('https://example.test/nightly.AppImage', $payload['testing']['appImageAmd64Url'] ?? null);
        $this->assertSame('https://example.test/nightly.apk', $payload['testing']['apkUrl'] ?? null);
        $this->assertSame('nightly-2026.08.04-af76f09', $payload['versions']['testing'][0]['tag'] ?? null);
        $this->assertSame('beta-2026.08.01-abcdef0', $payload['versions']['beta'][0]['tag'] ?? null);
    }

    public function test_prefers_bunny_cdn_urls_when_storage_has_matching_assets(): void
    {
        config([
            'services.bunny.storage_zone' => 'meshchatx',
            'services.bunny.access_key' => 'test-key',
            'services.bunny.storage_endpoint' => 'https://la.storage.bunnycdn.com',
            'services.bunny.cdn_base' => 'https://cdn.meshchatx.com',
        ]);

        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'nightly-2026.09.03-0cc046e',
                    'published_at' => '2026-09-03T13:00:00Z',
                    'prerelease' => true,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/nightly-2026.09.03-0cc046e',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.6-android-universal.apk',
                            'browser_download_url' => 'https://example.test/android.apk',
                            'digest' => 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.6-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/linux.AppImage',
                        ],
                    ],
                ],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/' => Http::response([
                ['ObjectName' => 'nightly', 'IsDirectory' => true],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/' => Http::response([
                [
                    'ObjectName' => 'nightly-2026.09.03-0cc046e',
                    'IsDirectory' => true,
                    'DateCreated' => '2026-09-03T13:02:40',
                ],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/nightly-2026.09.03-0cc046e/' => Http::response([
                [
                    'ObjectName' => 'ReticulumMeshChatX-v4.8.6-linux-x86_64.AppImage',
                    'IsDirectory' => false,
                    'Checksum' => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ],
                ['ObjectName' => 'android', 'IsDirectory' => true],
            ], 200),
            'la.storage.bunnycdn.com/meshchatx/nightly/nightly-2026.09.03-0cc046e/android/' => Http::response([
                [
                    'ObjectName' => 'ReticulumMeshChatX-v4.8.6-android-universal.apk',
                    'IsDirectory' => false,
                    'Checksum' => 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                ],
            ], 200),
        ]);

        $payload = app(GithubReleasesService::class)->payload();
        $pre = $payload['testing'] ?? null;

        $this->assertSame(
            'https://cdn.meshchatx.com/nightly/nightly-2026.09.03-0cc046e/android/ReticulumMeshChatX-v4.8.6-android-universal.apk',
            $pre['apkUrl'] ?? null,
        );
        $this->assertSame(
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            $pre['apkSha256'] ?? null,
        );
        $this->assertSame(
            'https://cdn.meshchatx.com/nightly/nightly-2026.09.03-0cc046e/ReticulumMeshChatX-v4.8.6-linux-x86_64.AppImage',
            $pre['appImageAmd64Url'] ?? null,
        );
        $this->assertSame('bunny', $pre['downloadServer'] ?? null);
        $this->assertSame(['bunny', 'github'], $pre['downloadServers'] ?? null);
        $this->assertSame(
            'https://example.test/android.apk',
            $pre['assetsByServer']['github']['apkUrl'] ?? null,
        );
    }

    public function test_falls_back_to_github_when_bunny_lookup_fails(): void
    {
        config([
            'services.bunny.storage_zone' => 'meshchatx',
            'services.bunny.access_key' => 'test-key',
            'services.bunny.storage_endpoint' => 'https://la.storage.bunnycdn.com',
            'services.bunny.cdn_base' => 'https://cdn.meshchatx.com',
        ]);

        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'v4.8.5',
                    'published_at' => '2026-08-20T00:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.5',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.5-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/stable.AppImage',
                        ],
                    ],
                ],
            ], 200),
            'la.storage.bunnycdn.com/*' => Http::response('nope', 500),
        ]);

        $payload = app(GithubReleasesService::class)->payload();

        $this->assertSame('https://example.test/stable.AppImage', $payload['stable']['appImageAmd64Url'] ?? null);
        $this->assertSame('github', $payload['stable']['downloadServer'] ?? null);
        $this->assertSame(['github'], $payload['stable']['downloadServers'] ?? null);
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
                            'digest' => 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                        ],
                        [
                            'name' => 'app-release-signed.apk',
                            'browser_download_url' => 'https://example.test/android.apk',
                            'digest' => 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
                        ],
                        [
                            'name' => 'reticulum_meshchatx-4.8.3-py3-none-any.whl',
                            'browser_download_url' => 'https://example.test/meshchatx.whl',
                            'digest' => 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-mac-universal.dmg',
                            'browser_download_url' => 'https://example.test/mac.dmg',
                            'digest' => 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-mac-universal.dmg.cosign.bundle',
                            'browser_download_url' => 'https://example.test/mac.dmg.cosign.bundle',
                            'digest' => 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        ],
                        [
                            'name' => 'sbom.cyclonedx.json',
                            'browser_download_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/download/v4.8.3/sbom.cyclonedx.json',
                            'digest' => 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $stable = app(GithubReleasesService::class)->payload()['stable'] ?? null;

        $this->assertIsArray($stable);
        $this->assertSame('https://example.test/meshchatx.whl', $stable['wheelUrl'] ?? null);
        $this->assertSame('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', $stable['wheelSha256'] ?? null);
        $this->assertSame('https://example.test/alpine.apk', $stable['alpineApkUrl'] ?? null);
        $this->assertSame('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', $stable['alpineApkSha256'] ?? null);
        $this->assertSame('https://example.test/android.apk', $stable['apkUrl'] ?? null);
        $this->assertSame('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $stable['apkSha256'] ?? null);
        $this->assertSame('https://example.test/mac.dmg', $stable['macDmgUrl'] ?? null);
        $this->assertSame('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', $stable['macDmgSha256'] ?? null);
        $this->assertSame('https://github.com/Quad4-Software/MeshChatX/releases/download/v4.8.3/sbom.cyclonedx.json', $stable['sbomUrl'] ?? null);
        $this->assertSame('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', $stable['sbomSha256'] ?? null);
        $this->assertNotSame($stable['apkUrl'], $stable['alpineApkUrl']);
    }

    public function test_testing_channel_includes_dev_tagged_releases(): void
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
        $this->assertSame('4.8.0-beta.1', $payload['beta']['version'] ?? null);
        $this->assertSame('dev-2026.08.05', $payload['testing']['version'] ?? null);
        $this->assertSame('https://example.test/dev-win.exe', $payload['testing']['winInstallerUrl'] ?? null);
        $this->assertSame($payload['testing'], $payload['prerelease']);
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
        $this->assertSame('nightly-2026.08.04-af76f09', $payload['testing']['version'] ?? null);
        $this->assertSame($payload['testing'], $payload['prerelease']);
        $this->assertTrue($payload['testing']['isPrerelease'] ?? false);
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
