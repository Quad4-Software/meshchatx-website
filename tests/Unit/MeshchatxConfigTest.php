<?php

namespace Tests\Unit;

use App\Support\SiteTranslator;
use Tests\TestCase;

class MeshchatxConfigTest extends TestCase
{
    public function test_site_config_has_required_keys(): void
    {
        $this->assertSame('MeshChatX', config('meshchatx.name'));
        $this->assertContains('en', config('meshchatx.locales'));
        $this->assertNotEmpty(config('meshchatx.nav'));
        $this->assertSame('https://forum.meshchatx.com/', config('meshchatx.forum_url'));
        $this->assertContains('nav.forum', array_column(config('meshchatx.nav'), 'label_key'));
        $this->assertNotContains('nav.interfaces', array_column(config('meshchatx.nav'), 'label_key'));
        $this->assertContains('nav.interfaces', array_column(config('meshchatx.footer_nav'), 'label_key'));
        $this->assertContains('interfaces', config('meshchatx.pages'));
        $this->assertNotEmpty(config('meshchatx.sitemap'));
        $this->assertNotEmpty(config('meshchatx.roadmap'));
        $this->assertCount(12, config('meshchatx.showcase_tabs'));
    }

    public function test_translator_reads_english_strings(): void
    {
        $t = app(SiteTranslator::class);
        $this->assertSame('MeshChatX', $t->get('brand.name', [], 'en'));
        $this->assertSame('Download', $t->get('dl.h1', [], 'en'));
        $this->assertSame('Portable', $t->get('dl.windows.btn_portable', [], 'en'));
        $this->assertSame('Interfaces', $t->get('nav.interfaces', [], 'en'));
        $this->assertNotSame('home.hero.h1', $t->get('home.hero.h1', [], 'en'));
    }

    public function test_translator_falls_back_for_empty_locale_keys(): void
    {
        $t = app(SiteTranslator::class);
        $en = $t->get('footer.tagline', [], 'en');
        $this->assertNotEmpty($en);
        $this->assertIsString($t->get('footer.tagline', [], 'de'));
    }
}
