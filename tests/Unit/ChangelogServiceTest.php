<?php

namespace Tests\Unit;

use App\Services\ChangelogService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChangelogServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['meshchatx.changelog_per_page' => 2]);
    }

    public function test_parses_released_and_unreleased_entries(): void
    {
        Http::fake([
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [4.8.6] - 2026-08-30 [unreleased]

### Added

- **Nomad private tabs**: Purple private tabs.

## [4.8.5] - 2026-08-21 [released]

### Fixed

- **Map**: Markers update again.

## [4.8.3] - 2026-08-14

### Fixed

- **Sidebar**: Works after restart.
MD, 200),
        ]);

        $entries = app(ChangelogService::class)->entries();

        $this->assertCount(3, $entries);
        $this->assertSame('4.8.6', $entries[0]['version']);
        $this->assertFalse($entries[0]['released']);
        $this->assertSame('4.8.5', $entries[1]['version']);
        $this->assertTrue($entries[1]['released']);
        $this->assertSame('4.8.3', $entries[2]['version']);
        $this->assertTrue($entries[2]['released']);
        $this->assertNotEmpty($entries[1]['summary']);
        $this->assertStringContainsString('Markers update again', $entries[1]['html']);
    }

    public function test_released_by_version_skips_unreleased(): void
    {
        Http::fake([
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [4.8.6] - 2026-08-30 [unreleased]

- Pending work.

## [4.8.5] - 2026-08-21 [released]

- Shipped work.
MD, 200),
        ]);

        $map = app(ChangelogService::class)->releasedByVersion();

        $this->assertArrayNotHasKey('4.8.6', $map);
        $this->assertArrayHasKey('4.8.5', $map);
    }

    public function test_uses_stale_cache_when_fetch_fails(): void
    {
        Cache::put('meshchatx.changelog.raw.stale', <<<'MD'
# Changelog

## [4.8.1] - 2026-07-25 [released]

- Cached entry.
MD, 3600);

        Http::fake([
            'raw.githubusercontent.com/*' => Http::response('nope', 500),
        ]);

        $entries = app(ChangelogService::class)->entries();

        $this->assertCount(1, $entries);
        $this->assertSame('4.8.1', $entries[0]['version']);
    }

    public function test_paginates_entries(): void
    {
        Http::fake([
            'raw.githubusercontent.com/*' => Http::response($this->manyVersionsMarkdown(5), 200),
        ]);

        $service = app(ChangelogService::class);
        $page1 = $service->page(1);
        $page2 = $service->page(2);
        $page3 = $service->page(3);

        $this->assertSame(5, $page1['total']);
        $this->assertSame(3, $page1['total_pages']);
        $this->assertTrue($page1['has_more']);
        $this->assertSame(2, $page1['next_page']);
        $this->assertCount(2, $page1['entries']);
        $this->assertSame('5.0.0', $page1['entries'][0]['version']);
        $this->assertSame('4.0.0', $page1['entries'][1]['version']);
        $this->assertSame('3.0.0', $page2['entries'][0]['version']);
        $this->assertFalse($page3['has_more']);
        $this->assertSame(2, $service->pageForAnchor('v-3-0-0'));
        $this->assertSame(3, $service->pageForAnchor('v-1-0-0'));
    }

    public function test_strips_xss_from_markdown_html(): void
    {
        Http::fake([
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [9.9.9] - 2026-01-01 [released]

- Safe note.
- <script>alert(1)</script>
- [evil](javascript:alert(1))
- <img src=x onerror="alert(1)">
MD, 200),
        ]);

        $html = app(ChangelogService::class)->entries()[0]['html'];

        $this->assertStringContainsString('Safe note', $html);
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringNotContainsString('javascript:', $html);
        $this->assertStringNotContainsString('onerror', $html);
    }

    public function test_rejects_malicious_version_headers(): void
    {
        Http::fake([
            'raw.githubusercontent.com/*' => Http::response(<<<'MD'
# Changelog

## [<script>x</script>] - 2026-01-01 [released]

- Bad.

## [1.2.3] - 2026-01-02 [released]

- Good.
MD, 200),
        ]);

        $entries = app(ChangelogService::class)->entries();

        $this->assertCount(1, $entries);
        $this->assertSame('1.2.3', $entries[0]['version']);
    }

    private function manyVersionsMarkdown(int $count): string
    {
        $chunks = ["# Changelog\n"];
        for ($i = $count; $i >= 1; $i--) {
            $chunks[] = "## [{$i}.0.0] - 2026-0{$i}-01 [released]\n\n- Item {$i}.\n";
        }

        return implode("\n", $chunks);
    }
}
