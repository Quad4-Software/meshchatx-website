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
                            'name' => 'sbom.cyclonedx.json',
                            'browser_download_url' => 'https://example.test/sbom.cyclonedx.json',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->get('/download')
            ->assertOk()
            ->assertSee('https://example.test/meshchatx.whl', false)
            ->assertSee('Download .whl', false)
            ->assertSee('https://example.test/alpine.apk', false)
            ->assertSee('Alpine Linux', false)
            ->assertSee('https://example.test/android.apk', false)
            ->assertSee('https://example.test/mac.dmg', false)
            ->assertSee('Download .dmg', false)
            ->assertSee('https://example.test/sbom.cyclonedx.json', false);
    }
}
