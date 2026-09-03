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
        $this->assertSame(
            ['nav.docs', 'nav.git', 'nav.contact'],
            array_column(config('meshchatx.nav'), 'label_key'),
        );
        $this->assertNotContains('nav.forum', array_column(config('meshchatx.nav'), 'label_key'));
        $this->assertNotContains('nav.forum', array_column(config('meshchatx.footer_nav'), 'label_key'));
        $this->assertNotContains('nav.interfaces', array_column(config('meshchatx.nav'), 'label_key'));
        $this->assertContains('nav.interfaces', array_column(config('meshchatx.footer_nav'), 'label_key'));
        $this->assertContains('nav.download', array_column(config('meshchatx.footer_nav'), 'label_key'));
        $this->assertContains('nav.roadmap', array_column(config('meshchatx.mobile_nav_secondary'), 'label_key'));
        $this->assertContains('interfaces', config('meshchatx.pages'));
        $this->assertContains('docs', config('meshchatx.pages'));
        $this->assertContains('changelog', config('meshchatx.pages'));
        $this->assertContains('changelog', config('meshchatx.sitemap'));
        $this->assertContains('nav.docs', array_column(config('meshchatx.nav'), 'label_key'));
        $this->assertContains('nav.docs', array_column(config('meshchatx.footer_nav'), 'label_key'));
        $this->assertSame(
            ['product', 'explore', 'legal'],
            array_values(array_unique(array_column(config('meshchatx.footer_nav'), 'group'))),
        );
        $this->assertNotEmpty(config('meshchatx.documentation.groups'));
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
        $this->assertSame('Docs', $t->get('nav.docs', [], 'en'));
        $this->assertNotSame('home.hero.h1', $t->get('home.hero.h1', [], 'en'));
    }

    public function test_translator_falls_back_for_empty_locale_keys(): void
    {
        $t = app(SiteTranslator::class);
        $en = $t->get('footer.tagline', [], 'en');
        $this->assertNotEmpty($en);
        $this->assertIsString($t->get('footer.tagline', [], 'de'));
    }

    public function test_prefixed_locales_cover_english_catalog_keys(): void
    {
        $flatten = static function (array $tree, string $prefix = '') use (&$flatten): array {
            $out = [];
            foreach ($tree as $key => $value) {
                $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;
                if (is_array($value) && ! array_is_list($value)) {
                    $out += $flatten($value, $path);
                } else {
                    $out[$path] = true;
                }
            }

            return $out;
        };

        $en = $flatten(json_decode((string) file_get_contents(lang_path('en.json')), true, 512, JSON_THROW_ON_ERROR));
        $enDownload = $flatten(json_decode((string) file_get_contents(lang_path('en.download.json')), true, 512, JSON_THROW_ON_ERROR));

        foreach (config('meshchatx.prefixed_locales') as $locale) {
            $localeKeys = $flatten(json_decode((string) file_get_contents(lang_path($locale.'.json')), true, 512, JSON_THROW_ON_ERROR));
            $downloadKeys = $flatten(json_decode((string) file_get_contents(lang_path($locale.'.download.json')), true, 512, JSON_THROW_ON_ERROR));

            $this->assertSame([], array_keys(array_diff_key($en, $localeKeys)), $locale.'.json missing keys');
            $this->assertSame([], array_keys(array_diff_key($enDownload, $downloadKeys)), $locale.'.download.json missing keys');
            $this->assertNotSame('Load more versions', app(SiteTranslator::class)->get('changelog.load_more', [], $locale));
        }
    }
}
