<?php

namespace Tests\Unit;

use App\Support\ErrorCopy;
use Illuminate\Http\Request;
use Tests\TestCase;

class ErrorCopyTest extends TestCase
{
    public function test_known_status_copy(): void
    {
        $copy = ErrorCopy::for(404);
        $this->assertSame('Page not found', $copy['title']);
        $this->assertNotEmpty($copy['lead']);
    }

    public function test_fallback_4xx_and_5xx(): void
    {
        $this->assertSame('Request could not be completed', ErrorCopy::for(418)['title']);
        $this->assertSame('Something went wrong', ErrorCopy::for(599)['title']);
    }

    public function test_locale_from_request(): void
    {
        $de = Request::create('/de/missing', 'GET');
        $this->assertSame('de', ErrorCopy::localeFromRequest($de));

        $en = Request::create('/missing', 'GET');
        $this->assertSame('en', ErrorCopy::localeFromRequest($en));
    }
}
