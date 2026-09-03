<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DependencyPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function releaseFixture(): array
    {
        return [
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
        ];
    }

    private function bomFixture(): array
    {
        return [
            'bomFormat' => 'CycloneDX',
            'specVersion' => '1.6',
            'metadata' => [
                'timestamp' => '2026-08-21T12:00:00Z',
                'tools' => [
                    'components' => [
                        ['type' => 'application', 'name' => 'trivy', 'version' => '0.69.3'],
                    ],
                ],
                'component' => [
                    'bom-ref' => 'root-1',
                    'type' => 'application',
                    'name' => '.',
                ],
            ],
            'components' => [
                [
                    'bom-ref' => 'pkg:pypi/reticulum-meshchatx@4.8.5',
                    'type' => 'library',
                    'name' => 'reticulum-meshchatx',
                    'version' => '4.8.5',
                    'purl' => 'pkg:pypi/reticulum-meshchatx@4.8.5',
                    'licenses' => [['license' => ['id' => 'MIT']]],
                ],
            ],
            'dependencies' => [
                ['ref' => 'root-1', 'dependsOn' => ['pkg:pypi/reticulum-meshchatx@4.8.5']],
                ['ref' => 'pkg:pypi/reticulum-meshchatx@4.8.5', 'dependsOn' => []],
            ],
        ];
    }

    public function test_dependency_page_renders_viewer_shell(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $this->get('/dependency')
            ->assertOk()
            ->assertSee('data-dep', false)
            ->assertSee('reticulum-meshchatx', false)
            ->assertSee('MeshChatX', false)
            ->assertSee('/logo.webp', false)
            ->assertSee('dep-graph-wrap', false)
            ->assertSee('data-dep-view="table"', false)
            ->assertSee('data-dep-panel="table"', false)
            ->assertSee('page-dep', false)
            ->assertSee('/api/mcx-sbom', false)
            ->assertSee('v4.8.5', false);

        $this->get('/dependency?v=4.8.5')
            ->assertOk()
            ->assertSee('data-selected="4.8.5"', false);
    }

    public function test_sbom_catalog_and_version_api(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $this->getJson('/api/mcx-sbom')
            ->assertOk()
            ->assertJsonPath('defaultVersion', '4.8.5')
            ->assertJsonStructure(['versions', 'defaultVersion', 'source']);

        $version = $this->getJson('/api/mcx-sbom/4.8.5')
            ->assertOk()
            ->assertJsonPath('version', '4.8.5')
            ->assertJsonStructure(['nodes', 'edges', 'stats', 'rootId', 'sourceUrl']);
        $this->assertStringContainsString('max-age=3600', (string) $version->headers->get('Cache-Control'));
        $this->assertStringContainsString('public', (string) $version->headers->get('Cache-Control'));

        $this->getJson('/api/mcx-sbom/9.9.9')
            ->assertNotFound();
    }

    public function test_warm_query_does_not_trigger_upstream_sbom_fetch(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $this->getJson('/api/mcx-sbom?warm=1')->assertOk();

        Http::assertSent(function ($request): bool {
            return str_contains($request->url(), 'api.github.com');
        });
        Http::assertNotSent(function ($request): bool {
            return str_contains($request->url(), 'github.com/Quad4-Software/MeshChatX/releases/download');
        });
    }

    public function test_oversized_version_path_is_rejected(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $this->getJson('/api/mcx-sbom/'.str_repeat('a', 65))->assertNotFound();
        Http::assertSentCount(0);
    }

    public function test_locale_dependency_page_responds(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $this->get('/de/dependency')->assertOk();
    }
}
