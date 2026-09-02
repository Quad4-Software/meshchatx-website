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
            ->assertSee('Back to home', false)
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin');

        $csp = $this->get('/this-page-does-not-exist')->headers->get('Content-Security-Policy');
        $this->assertIsString($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString('upgrade-insecure-requests', $csp);
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
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin')
            ->assertHeader('Cross-Origin-Resource-Policy', 'same-origin');

        $csp = $this->get('/')->headers->get('Content-Security-Policy');
        $this->assertIsString($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("worker-src 'self'", $csp);
        $this->assertStringNotContainsString('5173', $csp);
    }

    public function test_local_csp_allows_vite_hot_origin(): void
    {
        $hot = public_path('hot');
        $previous = is_file($hot) ? file_get_contents($hot) : null;
        file_put_contents($hot, "http://[::1]:5173\n");

        try {
            app()->detectEnvironment(fn (): string => 'local');

            $csp = $this->get('/')->headers->get('Content-Security-Policy');
            $this->assertIsString($csp);
            $this->assertStringNotContainsString('[::1]', $csp);
            $this->assertStringContainsString('http://127.0.0.1:5173', $csp);
            $this->assertStringContainsString('ws://127.0.0.1:5173', $csp);
            $this->assertStringContainsString('http://localhost:5173', $csp);
        } finally {
            if ($previous === null) {
                @unlink($hot);
            } else {
                file_put_contents($hot, $previous);
            }
            app()->detectEnvironment(fn (): string => 'testing');
        }
    }

    public function test_home_does_not_set_session_cookie(): void
    {
        $response = $this->get('/');
        $response->assertOk();

        $cookies = $response->headers->getCookies();
        foreach ($cookies as $cookie) {
            $this->assertStringNotContainsString('session', strtolower($cookie->getName()));
            $this->assertNotSame('XSRF-TOKEN', $cookie->getName());
        }
    }
}
