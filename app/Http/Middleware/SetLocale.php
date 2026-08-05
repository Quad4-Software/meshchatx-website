<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale');
        $allowed = config('meshchatx.locales', ['en']);
        $default = config('meshchatx.default_locale', 'en');

        if (! is_string($locale) || ! in_array($locale, $allowed, true)) {
            $locale = $default;
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
