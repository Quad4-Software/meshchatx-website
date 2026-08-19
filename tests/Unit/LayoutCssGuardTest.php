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
        $this->assertMatchesRegularExpression('/\.ifx-card__config\s*\{[^}]*overflow-wrap:\s*anywhere/', $css);
        $this->assertMatchesRegularExpression('/\.ifx-card__config\s*\{[^}]*white-space:\s*pre-wrap/', $css);
        $this->assertMatchesRegularExpression('/\.ifx-grid\s*\{[^}]*minmax\(min\(100%,\s*19rem\)/', $css);
        $this->assertMatchesRegularExpression('/\.branding-swatches\s*\{[^}]*minmax\(min\(100%,\s*9\.5rem\)/', $css);
        $this->assertMatchesRegularExpression('/\.mobile-nav\s+\.nav-link\s*\{[^}]*display:\s*flex/', $css);
        $this->assertMatchesRegularExpression('/\.mobile-nav\s+\.nav-link\s*\{[^}]*width:\s*100%/', $css);
        $this->assertMatchesRegularExpression('/\.mobile-nav\s*\{[^}]*position:\s*fixed/', $css);
        $this->assertMatchesRegularExpression('/\.nav-scrim\s*\{[^}]*position:\s*fixed/', $css);
        $this->assertMatchesRegularExpression('/\.site-header-wrap\s*\{[^}]*position:\s*sticky/', $css);
        $this->assertMatchesRegularExpression('/\.command-block__body\s*\{[^}]*white-space:\s*pre-wrap/', $css);
        $this->assertMatchesRegularExpression('/\.download-panel\s*\{[^}]*min-width:\s*0/', $css);
        $this->assertMatchesRegularExpression('/\.download-stack\s*\{[^}]*min-width:\s*0/', $css);
        $this->assertMatchesRegularExpression('/\.site-header__cta\s*\{[^}]*display:\s*none/', $css);

        $ctaDesktop = strpos($css, "        .site-header__cta {\n            display: inline-flex;");
        $this->assertNotFalse($ctaDesktop);
        $desktopSlice = substr($css, max(0, $ctaDesktop - 180), 700);
        $this->assertStringContainsString('@media (min-width: 1024px)', $desktopSlice);
        $this->assertStringContainsString('.menu-toggle', $desktopSlice);
        $this->assertStringContainsString('display: none', $desktopSlice);

        $tablet = strpos($css, '@media (min-width: 768px)');
        $this->assertNotFalse($tablet);
        $desktopNav = strpos($css, '@media (min-width: 1024px)', $tablet);
        $this->assertNotFalse($desktopNav);
        $tabletSlice = substr($css, $tablet, $desktopNav - $tablet);
        $this->assertStringNotContainsString('.menu-toggle', $tabletSlice);
    }
}
