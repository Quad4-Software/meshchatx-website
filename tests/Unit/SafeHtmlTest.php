<?php

namespace Tests\Unit;

use App\Support\SafeHtml;
use App\Support\SafeText;
use Tests\TestCase;

class SafeHtmlTest extends TestCase
{
    public function test_strips_script_and_event_handlers(): void
    {
        $html = SafeHtml::sanitize(
            '<p>ok</p><script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>',
        );

        $this->assertStringContainsString('<p>ok</p>', $html);
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringNotContainsString('onerror', $html);
        $this->assertStringNotContainsString('javascript:', $html);
    }

    public function test_keeps_safe_links_and_forces_noopener(): void
    {
        $html = SafeHtml::sanitize(
            '<a href="https://example.com" target="_blank">ex</a><a href="/docs/overview">local</a>',
        );

        $this->assertStringContainsString('href="https://example.com"', $html);
        $this->assertStringContainsString('href="/docs/overview"', $html);
        $this->assertStringContainsString('rel="noopener noreferrer"', $html);
    }

    public function test_blocks_data_uri_images(): void
    {
        $html = SafeHtml::sanitize('<img src="data:text/html,<script>alert(1)</script>" alt="x">');

        $this->assertStringNotContainsString('data:', $html);
    }

    public function test_safe_text_strips_tags_and_controls(): void
    {
        $this->assertSame('hello', SafeText::plain("<b>hello</b>\x00"));
        $this->assertSame('&lt;x&gt;', SafeText::xml('<x>'));
    }
}
