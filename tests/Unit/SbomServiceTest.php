<?php

namespace Tests\Unit;

use App\Services\GithubReleasesService;
use App\Services\SbomService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SbomServiceTest extends TestCase
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
            [
                'tag_name' => 'nightly-2026.09.02-abc',
                'published_at' => '2026-09-02T12:00:00Z',
                'prerelease' => true,
                'draft' => false,
                'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/nightly-2026.09.02-abc',
                'assets' => [
                    [
                        'name' => 'sbom.cyclonedx.json',
                        'browser_download_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/download/nightly/sbom.cyclonedx.json',
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
            'version' => 1,
            'metadata' => [
                'timestamp' => '2026-08-21T12:00:00Z',
                'tools' => [
                    'components' => [
                        [
                            'type' => 'application',
                            'name' => 'trivy',
                            'version' => '0.69.3',
                        ],
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
                    'bom-ref' => 'req',
                    'type' => 'application',
                    'name' => 'requirements.txt',
                ],
                [
                    'bom-ref' => 'pkg:pypi/reticulum-meshchatx@4.8.5',
                    'type' => 'library',
                    'name' => 'reticulum-meshchatx',
                    'version' => '4.8.5',
                    'purl' => 'pkg:pypi/reticulum-meshchatx@4.8.5',
                    'licenses' => [
                        ['license' => ['id' => 'MIT']],
                    ],
                ],
                [
                    'bom-ref' => 'pkg:pypi/rns@1.0.0',
                    'type' => 'library',
                    'name' => 'rns',
                    'version' => '1.0.0',
                    'purl' => 'pkg:pypi/rns@1.0.0',
                    'licenses' => [
                        ['license' => ['id' => 'MIT']],
                    ],
                ],
                [
                    'bom-ref' => 'pkg:npm/lodash@4.17.21',
                    'type' => 'library',
                    'name' => 'lodash',
                    'version' => '4.17.21',
                    'purl' => 'pkg:npm/lodash@4.17.21',
                    'licenses' => [
                        ['license' => ['id' => 'MIT']],
                    ],
                ],
            ],
            'dependencies' => [
                ['ref' => 'root-1', 'dependsOn' => ['req']],
                ['ref' => 'req', 'dependsOn' => ['pkg:pypi/reticulum-meshchatx@4.8.5']],
                ['ref' => 'pkg:pypi/reticulum-meshchatx@4.8.5', 'dependsOn' => ['pkg:pypi/rns@1.0.0']],
                ['ref' => 'pkg:pypi/rns@1.0.0', 'dependsOn' => []],
                ['ref' => 'pkg:npm/lodash@4.17.21', 'dependsOn' => []],
            ],
        ];
    }

    public function test_catalog_lists_sbom_releases_and_prefers_stable_default(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $catalog = app(SbomService::class)->catalog();

        $this->assertSame('4.8.5', $catalog['defaultVersion']);
        $this->assertCount(2, $catalog['versions']);
        $this->assertSame('4.8.5', $catalog['versions'][1]['version']);
        $this->assertTrue($catalog['versions'][0]['isPrerelease']);
        $this->assertFalse($catalog['versions'][1]['cached']);
    }

    public function test_for_version_normalizes_and_caches_sbom(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $service = app(SbomService::class);
        $payload = $service->forVersion('4.8.5');

        $this->assertNotNull($payload);
        $this->assertSame('4.8.5', $payload['version']);
        $this->assertSame('trivy 0.69.3', $payload['tool']);
        $this->assertGreaterThanOrEqual(5, $payload['stats']['components']);
        $this->assertNotEmpty($payload['edges']);
        $this->assertNotNull($payload['rootId']);
        $this->assertContains('pypi', array_keys($payload['stats']['ecosystems']));
        $root = array_values(array_filter(
            $payload['nodes'],
            fn (array $node): bool => ($node['id'] ?? null) === $payload['rootId'],
        ))[0] ?? null;
        $this->assertNotNull($root);
        $this->assertSame('MeshChatX', $root['label']);
        $this->assertSame('app', $root['kind']);
        $this->assertTrue($root['logo']);
        $appNodes = array_values(array_filter(
            $payload['nodes'],
            fn (array $node): bool => ($node['kind'] ?? '') === 'app' || ! empty($node['logo']),
        ));
        $this->assertCount(1, $appNodes);
        $pkg = array_values(array_filter(
            $payload['nodes'],
            fn (array $node): bool => ($node['name'] ?? '') === 'reticulum-meshchatx',
        ))[0] ?? null;
        $this->assertNotNull($pkg);
        $this->assertSame('reticulum-meshchatx', $pkg['label']);
        $this->assertSame('package', $pkg['kind']);
        $this->assertFalse($pkg['logo']);

        Http::assertSentCount(2);

        $again = $service->forVersion('v4.8.5');
        $this->assertSame($payload['version'], $again['version']);
        Http::assertSentCount(2);

        $catalog = $service->catalog();
        $stable = array_values(array_filter(
            $catalog['versions'],
            fn (array $row): bool => $row['version'] === '4.8.5',
        ))[0];
        $this->assertTrue($stable['cached']);
    }

    public function test_github_releases_service_lists_sbom_assets(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $rows = app(GithubReleasesService::class)->sbomReleases();
        $this->assertCount(2, $rows);
        $this->assertSame('https://github.com/Quad4-Software/MeshChatX/releases/download/nightly/sbom.cyclonedx.json', $rows[0]['sbomUrl']);
    }

    public function test_missing_version_returns_null(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $this->assertNull(app(SbomService::class)->forVersion('9.9.9'));
    }

    public function test_unknown_version_is_negatively_cached(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $service = app(SbomService::class);
        $this->assertNull($service->forVersion('nope-1.0.0'));
        Http::assertSentCount(1);

        $this->assertNull($service->forVersion('nope-1.0.0'));
        Http::assertSentCount(1);
    }

    public function test_failed_sbom_fetch_is_negatively_cached(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response('gone', 404),
        ]);

        $service = app(SbomService::class);
        $this->assertNull($service->forVersion('4.8.5'));
        Http::assertSentCount(2);

        $this->assertNull($service->forVersion('4.8.5'));
        Http::assertSentCount(2);
    }

    public function test_rejects_oversized_version_strings(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $this->assertNull(app(SbomService::class)->forVersion(str_repeat('a', 65)));
        Http::assertSentCount(0);
    }

    public function test_rejects_non_allowlisted_sbom_fetch_hosts(): void
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
                            'browser_download_url' => 'https://evil.example/sbom.json',
                        ],
                    ],
                ],
            ], 200),
            'evil.example/*' => Http::response($this->bomFixture(), 200),
        ]);

        $this->assertNull(app(SbomService::class)->forVersion('4.8.5'));
        Http::assertSent(fn ($request): bool => str_contains($request->url(), 'api.github.com'));
        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), 'evil.example'));
    }

    public function test_catalog_is_cached_briefly(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
        ]);

        $service = app(SbomService::class);
        $first = $service->catalog();
        Cache::flush();
        Cache::put('meshchatx.sbom.catalog.v1', $first, 60);

        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response([], 500),
        ]);

        $second = $service->catalog();
        $this->assertSame($first['defaultVersion'], $second['defaultVersion']);
        $this->assertCount(2, $second['versions']);
    }

    public function test_warm_missing_fetches_uncached_only(): void
    {
        Http::fake([
            'api.github.com/repos/*/releases*' => Http::response($this->releaseFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/v4.8.5/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
            'github.com/Quad4-Software/MeshChatX/releases/download/nightly/sbom.cyclonedx.json' => Http::response($this->bomFixture(), 200),
        ]);

        $service = app(SbomService::class);
        $this->assertSame(1, $service->warmMissing(1));
        $this->assertSame(1, $service->warmMissing(1));
    }
}
