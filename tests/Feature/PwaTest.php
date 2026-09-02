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
            ->assertSee('interfaces', false)
            ->assertSee('changelog', false)
            ->assertSee('offline', false)
            ->assertSee(PwaAssets::cacheVersion(), false);
    }

    public function test_offline_page_renders(): void
    {
        $this->get('/offline')
            ->assertOk()
            ->assertSee('You are offline', false)
            ->assertSee('noindex, nofollow', false)
            ->assertSee('data-offline-retry', false);
    }

    public function test_layout_exposes_pwa_hooks(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('data-pwa-toast', false)
            ->assertSee('data-pwa-i18n', false)
            ->assertSee('rel="manifest"', false)
            ->assertSee('/manifest.webmanifest', false);
    }

    public function test_csp_allows_workers_and_manifest(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $this->assertIsString($csp);
        $this->assertStringContainsString("worker-src 'self'", $csp);
        $this->assertStringContainsString("manifest-src 'self'", $csp);
    }

    public function test_pwa_assets_lists_vite_build_files_when_present(): void
    {
        $urls = PwaAssets::precacheUrls();

        $this->assertContains('/', $urls);
        $this->assertContains('/offline', $urls);
        $this->assertContains('/manifest.webmanifest', $urls);

        if (is_file(public_path('build/manifest.json'))) {
            $this->assertTrue(
                collect($urls)->contains(fn (string $url): bool => str_starts_with($url, '/build/')),
            );
        }
    }
}
