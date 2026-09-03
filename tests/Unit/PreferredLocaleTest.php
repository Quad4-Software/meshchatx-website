<?php

namespace Tests\Unit;

use App\Support\PreferredLocale;
use Illuminate\Http\Request;
use Tests\TestCase;

class PreferredLocaleTest extends TestCase
{
    public function test_parses_accept_language_in_quality_order(): void
    {
        $request = Request::create('/', 'GET', [], [], [], [
            'HTTP_ACCEPT_LANGUAGE' => 'fr-FR,fr;q=0.9,de-DE;q=0.8,en;q=0.7',
        ]);

        $this->assertSame('fr', PreferredLocale::fromAcceptLanguage($request));
    }

    public function test_cookie_wins_in_resolve(): void
    {
        $request = Request::create('/', 'GET', [], [
            PreferredLocale::COOKIE => 'zh',
        ], [], [
            'HTTP_ACCEPT_LANGUAGE' => 'de-DE,de;q=0.9',
        ]);

        $this->assertSame('zh', PreferredLocale::resolve($request));
    }
}
