<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChangelogPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['meshchatx.changelog_per_page' => 2]);

        Http::fake([
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [4.8.6] - 2026-08-30 [unreleased]

### Added

- **Pending**: Not shipped yet.

## [4.8.5] - 2026-08-21 [released]

### Fixed

- **Map**: Markers update again.

## [4.8.4] - 2026-08-18 [released]

### Fixed

- **Audio**: Device picker works.

## [4.8.3] - 2026-08-14 [released]

### Fixed

- **Sidebar**: Works after restart.

## [1.0.0] - 2026-01-01 [released]

### Notes

- Note with <b>tags</b> & "quotes".
MD, 200),
        ]);
    }

    public function test_changelog_page_renders_first_page_only(): void
    {
        $this->get('/changelog')
            ->assertOk()
            ->assertSee('Changelog', false)
            ->assertSee('v4.8.6', false)
            ->assertSee('v4.8.5', false)
            ->assertSee('v4.8.3', false)
            ->assertSee('Unreleased', false)
            ->assertSee('Markers update again', false)
            ->assertDontSee('Works after restart', false)
            ->assertDontSee('Device picker works', false)
            ->assertSee('/changelog.xml', false)
            ->assertSee('application/rss+xml', false)
            ->assertSee('data-changelog', false)
            ->assertSee('Load more versions', false);
    }

    public function test_changelog_entries_endpoint_paginates(): void
    {
        $response = $this->get('/changelog/entries?page=2');

        $response->assertOk()
            ->assertHeader('X-Changelog-Has-More', '1')
            ->assertHeader('X-Changelog-Next-Page', '3')
            ->assertSee('v4.8.4', false)
            ->assertSee('Device picker works', false)
            ->assertDontSee('v4.8.6', false);
    }

    public function test_changelog_entries_until_loads_range(): void
    {
        $response = $this->get('/changelog/entries?page=2&until=v-1-0-0');

        $response->assertOk()
            ->assertHeader('X-Changelog-Has-More', '0')
            ->assertSee('v4.8.4', false)
            ->assertSee('v4.8.3', false)
            ->assertSee('v1.0.0', false)
            ->assertSee('Works after restart', false);
    }

    public function test_changelog_rss_lists_released_only(): void
    {
        $response = $this->get('/changelog.xml');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/rss+xml; charset=UTF-8')
            ->assertSee('MeshChatX v4.8.5', false)
            ->assertDontSee('MeshChatX v4.8.6', false);
    }

    public function test_changelog_rss_escapes_xml_payloads(): void
    {
        $xml = $this->get('/changelog.xml')->getContent();

        $this->assertStringContainsString('MeshChatX v1.0.0', $xml);
        $this->assertStringNotContainsString('<b>tags</b>', $xml);
        $this->assertStringContainsString('&amp;', $xml);
        $this->assertStringContainsString('&quot;quotes&quot;', $xml);
    }

    public function test_locale_prefixed_changelog_works(): void
    {
        $this->get('/de/changelog')
            ->assertOk()
            ->assertSee('v4.8.5', false);

        $this->get('/de/changelog/entries?page=2')
            ->assertOk()
            ->assertSee('v4.8.4', false);
    }

    public function test_sitemap_includes_changelog(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('/changelog', false)
            ->assertSee('/de/changelog', false);
    }
}
