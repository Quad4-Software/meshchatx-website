<?php

namespace Tests\Feature;

use Tests\TestCase;

class BrandingPageTest extends TestCase
{
    public function test_branding_page_lists_assets_and_sizes(): void
    {
        $this->get('/branding')
            ->assertOk()
            ->assertSee('Branding', false)
            ->assertSee('800px', false)
            ->assertSee('Logo with text', false)
            ->assertSee('/media/branding/lockup/lockup-128.png', false)
            ->assertSee('/media/branding/lockup/lockup.svg', false)
            ->assertSee('/media/branding/logo/logo-512.png', false)
            ->assertSee('/media/branding/icon/favicon.ico', false)
            ->assertDontSee('branding-swatches', false);
    }

    public function test_home_includes_platform_icon_classes(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('mcx-icon', false)
            ->assertSee('viewBox="0 0 24 24"', false)
            ->assertSee('platform-chip', false)
            ->assertSee('/download#windows', false)
            ->assertSee('cap-row', false)
            ->assertSee('cap-row__item', false)
            ->assertSee('RRC', false)
            ->assertDontSee('cap-marquee', false)
            ->assertDontSee('+ more', false)
            ->assertSee('home-hero__bg', false)
            ->assertSee('feature-grid', false)
            ->assertSee('feature-grid--home', false)
            ->assertDontSee('feature-grid--cards', false)
            ->assertSee('data-home-download', false)
            ->assertSee('Encrypted messages', false)
            ->assertSee('No data centers', false)
            ->assertSee('No signup', false)
            ->assertSee('Internet, radio, or mesh', false)
            ->assertSee('Saved on your device', false)
            ->assertSee('Many languages', false)
            ->assertSee('feature-langs-bar', false)
            ->assertSee('feature-langs', false)
            ->assertSee('https://reticulum.network/crypto.html', false)
            ->assertSee('Reticulum Crypto', false)
            ->assertDontSee('Android is available via Termux', false);
    }

    public function test_git_page_lists_mirrors(): void
    {
        $this->get('/git')
            ->assertOk()
            ->assertSee('rngit', false)
            ->assertSee('Git over Reticulum', false)
            ->assertSee('/vendor/reticulum-logo.png', false)
            ->assertSee('git clone rns://06a54b505bb67b25ef3f8097e8001edc/public/MeshChatX', false)
            ->assertSee('132f67e79d9b24aad014e93015fb858f:/page/repo.mu`g=public|r=MeshChatX', false)
            ->assertDontSee('git.quad4.io', false)
            ->assertDontSee('git clone https://', false)
            ->assertDontSee('gitea-logo.svg', false)
            ->assertSee('lavaforge.org', false)
            ->assertSee('github.com/Quad4-Software/MeshChatX', false);
    }

    public function test_home_uses_reticulum_logo_as_hero_background(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('src="/vendor/reticulum-logo.png"', false)
            ->assertSee('home-hero__bg-img', false)
            ->assertDontSee('home-hero__bg-img--light', false)
            ->assertDontSee('home-hero__bg-img--dark', false);
    }
}
