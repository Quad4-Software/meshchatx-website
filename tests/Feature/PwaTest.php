<?php

namespace Tests\Feature;

use App\Support\PwaAssets;
use Tests\TestCase;

class PwaTest extends TestCase
{
    public function test_service_worker_is_served_with_precache_urls(): void
    {
        $response = $this->get('/sw.js');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/javascript; charset=UTF-8')
            ->assertHeader('Service-Worker-Allowed', '/')
            ->assertSee('mcx-shell-', false)
            ->assertSee('docs\/overview', false)
            ->assertSee('download', false)
            ->assertSee('interfaces', false)
            ->assertSee('changelog', false)
            ->assertSee('offline', false)
            ->assertSee('isExcludedPage', false)
            ->assertSee(PwaAssets::cacheVersion(), false);

        $body = $response->getContent();
        $this->assertIsString($body);
        $this->assertStringContainsString("path === '/dependency'", $body);
        $this->assertStringNotContainsString('"/dependency"', $body);
    }

    public function test_service_worker_covers_prefixed_locales(): void
    {
        $response = $this->get('/sw.js');

        $response->assertOk();
        foreach (config('meshchatx.prefixed_locales') as $locale) {
            $response->assertSee($locale, false);
        }
    }

    public function test_offline_page_renders(): void
    {
        $this->get('/offline')
            ->assertOk()
            ->assertSee('You are offline', false)
            ->assertSee('noindex, nofollow', false)
            ->assertSee('data-offline-retry', false)
            ->assertSee(route('download', absolute: false), false);
    }

    public function test_layout_exposes_pwa_hooks(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('data-pwa-toast', false)
            ->assertSee('data-pwa-i18n', false)
            ->assertSee('rel="manifest"', false)
            ->assertSee('/manifest.webmanifest', false)
            ->assertSee('mobile-web-app-capable', false)
            ->assertSee('apple-mobile-web-app-capable', false);
    }

    public function test_csp_allows_workers_and_manifest(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $this->assertIsString($csp);
        $this->assertStringContainsString("worker-src 'self'", $csp);
        $this->assertStringContainsString("manifest-src 'self'", $csp);
    }

    public function test_pwa_assets_lists_site_pages_except_dependency(): void
    {
        $urls = PwaAssets::precacheUrls();

        $this->assertContains('/', $urls);
        $this->assertContains('/download', $urls);
        $this->assertContains('/docs', $urls);
        $this->assertContains('/docs/overview', $urls);
        $this->assertContains('/roadmap', $urls);
        $this->assertContains('/changelog', $urls);
        $this->assertContains('/interfaces', $urls);
        $this->assertContains('/branding', $urls);
        $this->assertContains('/contact', $urls);
        $this->assertContains('/donate', $urls);
        $this->assertContains('/license', $urls);
        $this->assertContains('/privacy', $urls);
        $this->assertContains('/git', $urls);
        $this->assertContains('/offline', $urls);
        $this->assertContains('/manifest.webmanifest', $urls);
        $this->assertNotContains('/dependency', $urls);

        if (is_file(public_path('build/manifest.json'))) {
            $this->assertTrue(
                collect($urls)->contains(fn (string $url): bool => str_starts_with($url, '/build/')),
            );
        }
    }

    public function test_manifest_is_installable(): void
    {
        $path = public_path('manifest.webmanifest');
        $this->assertFileExists($path);

        $body = (string) file_get_contents($path);
        $decoded = json_decode($body, true);

        $this->assertIsArray($decoded);
        $this->assertSame('MeshChatX', $decoded['name'] ?? null);
        $this->assertSame('standalone', $decoded['display'] ?? null);
        $this->assertSame('/', $decoded['start_url'] ?? null);
        $this->assertStringContainsString('/download', $body);
        $this->assertStringNotContainsString('/dependency', $body);
    }
}
