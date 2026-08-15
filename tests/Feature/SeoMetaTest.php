<?php

namespace Tests\Feature;

use Tests\TestCase;

class SeoMetaTest extends TestCase
{
    public function test_home_includes_json_ld_and_alternates(): void
    {
        $response = $this->get('/');

        $response->assertOk()
            ->assertSee('application/ld+json', false)
            ->assertSee('SoftwareApplication', false)
            ->assertSee('hreflang="de"', false)
            ->assertSee('hreflang="x-default"', false)
            ->assertSee('og:title', false)
            ->assertSee('twitter:card', false);
    }

    public function test_download_includes_breadcrumb_json_ld(): void
    {
        $this->get('/download')
            ->assertOk()
            ->assertSee('BreadcrumbList', false)
            ->assertSee('index, follow', false);
    }

    public function test_sitemap_lists_localized_urls(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('/download', false)
            ->assertSee('/de/download', false)
            ->assertSee('/interfaces', false)
            ->assertSee('hreflang', false);
    }
}
