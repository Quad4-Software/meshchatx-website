<?php

namespace Tests\Feature;

use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    public function test_english_pages_respond_ok(): void
    {
        foreach (['/', '/download', '/roadmap', '/interfaces', '/branding', '/contact', '/donate', '/license', '/privacy', '/git'] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_locale_prefixed_home_responds_ok(): void
    {
        foreach (['de', 'ru', 'it', 'zh'] as $locale) {
            $this->get('/'.$locale)->assertOk();
            $this->get('/'.$locale.'/download')->assertOk();
        }
    }

    public function test_sitemap_and_robots_respond(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Sitemap:', false);
    }

    public function test_releases_api_responds_json(): void
    {
        $this->getJson('/api/mcx-releases')
            ->assertOk()
            ->assertJsonStructure(['stable', 'prerelease', 'githubFallbackUrl']);
    }

    public function test_interfaces_api_responds_json(): void
    {
        $this->getJson('/api/mcx-interfaces')
            ->assertOk()
            ->assertJsonStructure(['source', 'interfaces', 'count', 'total', 'stale']);
    }

    public function test_home_shows_brand(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('MeshChatX', false);
    }

    public function test_header_exposes_mobile_menu_controls(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('data-menu-toggle', false)
            ->assertSee('data-mobile-nav', false)
            ->assertSee('site-header__cta', false)
            ->assertSee('mobile-nav__inner', false)
            ->assertSee('menu-toggle__icon--open', false)
            ->assertSee('menu-toggle__icon--close', false)
            ->assertSee('data-label-close', false);
    }

    public function test_roadmap_uses_full_width_and_october_milestone(): void
    {
        $this->get('/roadmap')
            ->assertOk()
            ->assertSee('October 2026', false)
            ->assertDontSee('site-container--narrow', false);
    }

    public function test_home_defers_youtube_embeds_until_click(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertDontSee('youtube.com/embed/', false)
            ->assertDontSee('youtube-nocookie.com/embed/', false)
            ->assertSee('data-video-embed', false)
            ->assertSee('data-video-trigger', false);
    }
}
