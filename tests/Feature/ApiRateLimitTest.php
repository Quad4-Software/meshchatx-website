<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ApiRateLimitTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        RateLimiter::clear('mcx-api');
        RateLimiter::clear('mcx-sbom');
        RateLimiter::clear('mcx-docs-export');
    }

    public function test_sbom_version_api_is_rate_limited(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([
                [
                    'tag_name' => 'v4.8.5',
                    'published_at' => '2026-08-21T12:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.5',
                    'assets' => [
                        [
                            'name' => 'sbom.cyclonedx.json',
                            'browser_download_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json',
                        ],
                    ],
                ],
            ], 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response([
                'bomFormat' => 'CycloneDX',
                'specVersion' => '1.6',
                'metadata' => [
                    'component' => [
                        'bom-ref' => 'root-1',
                        'type' => 'application',
                        'name' => '.',
                    ],
                ],
                'components' => [],
                'dependencies' => [
                    ['ref' => 'root-1', 'dependsOn' => []],
                ],
            ], 200),
        ]);

        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/mcx-sbom/4.8.5')->assertOk();
        }

        $this->getJson('/api/mcx-sbom/4.8.5')->assertStatus(429);
    }

    public function test_docs_export_all_is_rate_limited(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->get('/docs/export-all/md')->assertOk();
        }

        $this->get('/docs/export-all/md')->assertStatus(429);
    }
}
