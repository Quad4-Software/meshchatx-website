<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DownloadPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['services.bunny.access_key' => '']);
    }

    public function test_download_page_lists_wheel_alpine_apk_dmg_and_sbom(): void
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
                            'digest' => 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
                        ],
                        [
                            'name' => 'app-release-signed.apk',
                            'browser_download_url' => 'https://example.test/android.apk',
                            'digest' => 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
                        ],
                        [
                            'name' => 'reticulum_meshchatx-4.8.3-py3-none-any.whl',
                            'browser_download_url' => 'https://example.test/meshchatx.whl',
                            'digest' => 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-mac-universal.dmg',
                            'browser_download_url' => 'https://example.test/mac.dmg',
                            'digest' => 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
                        ],
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3.flatpak',
                            'browser_download_url' => 'https://example.test/meshchatx.flatpak',
                            'digest' => 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
                        ],
                        [
                            'name' => 'sbom.cyclonedx.json',
                            'browser_download_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/download/v4.8.3/sbom.cyclonedx.json',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->get('/download')
            ->assertOk()
            ->assertSee('https://example.test/meshchatx.whl', false)
            ->assertSee('Download .whl', false)
            ->assertSee('3333333333333333333333333333333333333333333333333333333333333333', false)
            ->assertSee('https://example.test/alpine.apk', false)
            ->assertSee('Alpine Linux', false)
            ->assertSee('1111111111111111111111111111111111111111111111111111111111111111', false)
            ->assertSee('https://example.test/android.apk', false)
            ->assertSee('2222222222222222222222222222222222222222222222222222222222222222', false)
            ->assertSee('https://example.test/mac.dmg', false)
            ->assertSee('Download .dmg', false)
            ->assertSee('4444444444444444444444444444444444444444444444444444444444444444', false)
            ->assertSee('SHA256', false)
            ->assertSee('https://github.com/Quad4-Software/MeshChatX/releases/download/v4.8.3/sbom.cyclonedx.json', false)
            ->assertSee('data-download-hero', false)
            ->assertSee('data-download-hero-checksum', false)
            ->assertSee('data-download-version', false)
            ->assertSee('Download server', false)
            ->assertSee('GitHub', false)
            ->assertSee('data-download-server="github"', false)
            ->assertSee('Next: Getting started', false)
            ->assertSee('/docs/getting-started', false)
            ->assertSee('/interfaces', false)
            ->assertSee('/dependency', false)
            ->assertSee('download-advanced__summary', false)
            ->assertSee('/vendor/platforms/debian.svg', false)
            ->assertSee('/vendor/platforms/docker.svg', false)
            ->assertSee('/vendor/platforms/python.svg', false)
            ->assertSee('/vendor/platforms/umbrel.svg', false)
            ->assertSee('data-download-panel="flatpak"', false)
            ->assertDontSee('data-download-panel="umbrel"', false)
            ->assertSee('Get on Umbrel', false)
            ->assertSee('More install options', false)
            ->assertSee('Install MeshChatX', false)
            ->assertSee('Download .flatpak file', false)
            ->assertSee('https://example.test/meshchatx.flatpak', false)
            ->assertSee('If your Linux uses Flatpak', false)
            ->assertSee('https://cdn.meshchatx.com/flatpak/meshchatx-stable.flatpakref', false)
            ->assertSee('com.quad4.meshchatx', false)
            ->assertSee('cdn.meshchatx.com/flatpak/meshchatx.flatpakrepo', false)
            ->assertDontSee('CDN remote', false)
            ->assertDontSee('not live on the CDN', false);
    }

    public function test_download_page_shows_bunny_download_server(): void
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

        $this->get('/download?channel=testing')
            ->assertOk()
            ->assertSee('Download server', false)
            ->assertSee('BunnyCDN', false)
            ->assertSee('GitHub', false)
            ->assertSee('data-download-source', false)
            ->assertSee('Also see:', false)
            ->assertSee('https://cdn.meshchatx.com/nightly/nightly-2026.09.03-0cc046e/android/ReticulumMeshChatX-v4.8.6-android-universal.apk', false)
            ->assertSee('channel=beta', false)
            ->assertSee('channel=testing', false)
            ->assertSee('Testing', false);
    }

    public function test_download_page_can_switch_to_github_source(): void
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

        $this->get('/download?channel=testing&source=github')
            ->assertOk()
            ->assertSee('data-download-source', false)
            ->assertSee('https://example.test/android.apk', false)
            ->assertDontSee('https://cdn.meshchatx.com/nightly/nightly-2026.09.03-0cc046e/android/ReticulumMeshChatX-v4.8.6-android-universal.apk', false);
    }

    public function test_download_page_hides_source_dropdown_when_only_github(): void
    {
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
        ]);

        $this->get('/download')
            ->assertOk()
            ->assertSee('data-download-server="github"', false)
            ->assertDontSee('data-download-source', false)
            ->assertSee('https://example.test/stable.AppImage', false);
    }

    public function test_download_server_follows_shown_asset_urls(): void
    {
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
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->get('/download?channel=testing&v=nightly-2026.09.03-0cc046e')
            ->assertOk()
            ->assertSee('data-download-server="github"', false)
            ->assertSee('GitHub', false)
            ->assertDontSee('data-download-source', false);
    }

    public function test_download_page_selects_version_via_query(): void
    {
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
                            'browser_download_url' => 'https://example.test/new.AppImage',
                        ],
                    ],
                ],
                [
                    'tag_name' => 'v4.8.3',
                    'published_at' => '2026-08-14T22:54:57Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.3',
                    'assets' => [
                        [
                            'name' => 'ReticulumMeshChatX-v4.8.3-linux-x86_64.AppImage',
                            'browser_download_url' => 'https://example.test/old.AppImage',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->get('/download?channel=stable&v=v4.8.3')
            ->assertOk()
            ->assertSee('https://example.test/old.AppImage', false)
            ->assertDontSee('https://example.test/new.AppImage', false)
            ->assertSee('v4.8.3', false)
            ->assertSee('data-download-version', false)
            ->assertSee('data-download-server="github"', false);
    }
}
