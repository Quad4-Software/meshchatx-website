<?php

namespace Tests\Feature;

use App\Support\PreferredLocale;
use Tests\TestCase;

class LocaleDetectionTest extends TestCase
{
    public function test_accept_language_redirects_unprefixed_home(): void
    {
        $this->withHeader('Accept-Language', 'de-DE,de;q=0.9,en;q=0.8')
            ->get('/')
            ->assertRedirect('/de');
    }

    public function test_cookie_prevents_accept_language_redirect(): void
    {
        $this->withUnencryptedCookie(PreferredLocale::COOKIE, 'en')
            ->withHeader('Accept-Language', 'de-DE,de;q=0.9')
            ->get('/')
            ->assertOk();
    }

    public function test_bots_are_not_redirected(): void
    {
        $this->withHeader('Accept-Language', 'de-DE')
            ->withHeader('User-Agent', 'Googlebot/2.1')
            ->get('/')
            ->assertOk();
    }
}
