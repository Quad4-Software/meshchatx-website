<?php

namespace Tests\Unit;

use Tests\TestCase;

class LayoutCssGuardTest extends TestCase
{
    public function test_app_css_blocks_horizontal_overflow_regressions(): void
    {
        $css = file_get_contents(resource_path('css/app.css'));
        $this->assertIsString($css);

        $this->assertStringNotContainsString('100vw', $css);
        $this->assertStringNotContainsString('50vw', $css);
        $this->assertStringNotContainsString('62vw', $css);
        $this->assertStringNotContainsString('54vw', $css);
        $this->assertDoesNotMatchRegularExpression('/\.home-hero__bg-img[^{]*\{[^}]*right:\s*-/', $css);
        $this->assertDoesNotMatchRegularExpression('/\.home-hero__bg-img[^{]*\{[^}]*max-width:\s*none/', $css);

        $this->assertMatchesRegularExpression('/\.site-shell\s*>\s*\*\s*\{[^}]*min-width:\s*0/', $css);
        $this->assertMatchesRegularExpression('/\.site-shell\s*>\s*main\s*\{[^}]*overflow-x:\s*clip/', $css);
        $this->assertMatchesRegularExpression('/\.cap-marquee\s*\{[^}]*max-width:\s*100%/', $css);
        $this->assertMatchesRegularExpression('/\.home-hero__bg-img\s*\{[^}]*max-width:\s*100%/', $css);
    }
}
