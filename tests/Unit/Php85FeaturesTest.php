<?php

namespace Tests\Unit;

use App\Support\SiteUri;
use Tests\TestCase;

class Php85FeaturesTest extends TestCase
{
    public function test_runtime_is_php_8_5_or_newer(): void
    {
        $this->assertGreaterThanOrEqual(80500, PHP_VERSION_ID);
    }

    public function test_array_helpers_work(): void
    {
        $value = strtoupper(trim('  MeshChatX  '));

        $this->assertSame('MESHCHATX', $value);
        $this->assertSame(2, array_first([2, 4, 6]));
        $this->assertSame(6, array_last([2, 4, 6]));
        $this->assertSame(4, array_find([2, 4, 6], fn (int $n): bool => $n > 3));
    }

    public function test_site_uri_uses_whatwg_parser(): void
    {
        $url = 'https://meshchatx.com/download';

        $this->assertTrue(SiteUri::isHttps($url));
        $this->assertSame('meshchatx.com', SiteUri::host($url));
        $this->assertSame($url, SiteUri::normalize($url));
    }

    public function test_clean_site_html_strips_legacy_markup(): void
    {
        $html = '<a href="/x" class="mcx-link-blue" style="text-decoration:underline">x</a>';

        $this->assertSame('<a href="/x">x</a>', clean_site_html($html));
    }
}
