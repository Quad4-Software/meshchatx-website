<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    public function test_english_pages_respond_ok(): void
    {
        foreach (['/', '/download', '/docs', '/roadmap', '/changelog', '/interfaces', '/branding', '/contact', '/donate', '/license', '/privacy', '/git', '/offline'] as $path) {
            if ($path === '/docs') {
                $this->get($path)->assertRedirect();

                continue;
            }
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
            ->assertSee('data-nav-scrim', false)
            ->assertSee('data-site-header', false)
            ->assertSee('mobile-nav__inner', false)
            ->assertSee('menu-toggle__icon--open', false)
            ->assertSee('menu-toggle__icon--close', false)
            ->assertSee('data-label-close', false);
    }

    public function test_roadmap_uses_full_width_and_timeline(): void
    {
        Http::fake([
            'api.github.com/*' => Http::response([
                [
                    'tag_name' => 'v4.8.5',
                    'published_at' => '2026-08-21T12:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.5',
                    'assets' => [],
                ],
                [
                    'tag_name' => 'v4.8.0',
                    'published_at' => '2026-07-01T12:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.8.0',
                    'assets' => [],
                ],
                [
                    'tag_name' => 'v4.7.0',
                    'published_at' => '2026-06-01T12:00:00Z',
                    'prerelease' => false,
                    'draft' => false,
                    'html_url' => 'https://github.com/Quad4-Software/MeshChatX/releases/tag/v4.7.0',
                    'assets' => [],
                ],
            ], 200),
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [4.8.5] - 2026-08-21 [released]

### Fixed

- **Map**: Markers update again.
MD, 200),
        ]);

        $this->get('/roadmap')
            ->assertOk()
            ->assertSee('February 2027', false)
            ->assertSee('November 2026', false)
            ->assertSee('roadmap-rail', false)
            ->assertSee('roadmap-timeline', false)
            ->assertSee('Release timeline', false)
            ->assertSee('is-patch', false)
            ->assertSee('v4.8.5', false)
            ->assertSee('data-roadmap-preview', false)
            ->assertDontSee('October 2026', false)
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
