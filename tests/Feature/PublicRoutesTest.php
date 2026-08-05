<?php

namespace Tests\Feature;

use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    public function test_english_pages_respond_ok(): void
    {
        foreach (['/', '/download', '/roadmap', '/branding', '/contact', '/donate', '/license', '/privacy', '/git'] as $path) {
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

    public function test_home_shows_brand(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('MeshChatX', false);
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
