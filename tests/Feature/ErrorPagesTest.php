<?php

namespace Tests\Feature;

use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    public function test_not_found_renders_branded_page(): void
    {
        $this->get('/this-page-does-not-exist')
            ->assertNotFound()
            ->assertSee('Page not found', false)
            ->assertSee('noindex, nofollow', false)
            ->assertSee('Back to home', false);
    }

    public function test_not_found_respects_locale_prefix(): void
    {
        $this->get('/de/does-not-exist')
            ->assertNotFound()
            ->assertSee('Zum Inhalt springen', false)
            ->assertSee('Zur Startseite', false)
            ->assertSee('Seite nicht gefunden', false);
    }

    public function test_security_headers_present_on_home(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
