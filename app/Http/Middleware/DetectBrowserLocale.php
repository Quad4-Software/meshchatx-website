<?php

namespace App\Http\Middleware;

use App\Support\LocaleUrl;
use App\Support\PreferredLocale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class DetectBrowserLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldRedirect($request)) {
            $preferred = PreferredLocale::resolve($request);
            $default = PreferredLocale::default();

            if ($preferred !== $default) {
                $target = $this->redirectTarget($request, $preferred);
                if ($target !== null) {
                    return redirect()->to($target, 302)
                        ->withCookie($this->localeCookie($preferred));
                }
            }
        }

        $response = $next($request);

        $locale = PreferredLocale::normalize((string) app()->getLocale())
            ?? PreferredLocale::default();

        if (! $request->cookies->has(PreferredLocale::COOKIE)
            || $request->cookie(PreferredLocale::COOKIE) !== $locale) {
            $response->headers->setCookie($this->localeCookie($locale));
        }

        return $response;
    }

    private function shouldRedirect(Request $request): bool
    {
        if (! $request->isMethod('GET') || $request->ajax() || PreferredLocale::isBot($request)) {
            return false;
        }

        if ($request->route('locale')) {
            return false;
        }

        if ($request->cookies->has(PreferredLocale::COOKIE)) {
            return false;
        }

        $path = trim($request->path(), '/');
        $skip = ['up', 'robots.txt', 'sitemap.xml', 'changelog.xml', 'sw.js', 'offline', 'api', 'build', 'vendor', 'showcase', 'media'];
        foreach ($skip as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return false;
            }
        }

        return true;
    }

    private function redirectTarget(Request $request, string $locale): ?string
    {
        $route = $request->route();
        $name = $route?->getName() ?? 'home';
        $params = $route?->parameters() ?? [];
        unset($params['locale']);

        $base = str_starts_with($name, 'locale.')
            ? substr($name, strlen('locale.'))
            : $name;

        if ($base === '') {
            $base = 'home';
        }

        $url = LocaleUrl::route($base, $params, $locale);
        $current = $request->fullUrl();

        return $url !== $current ? $url : null;
    }

    private function localeCookie(string $locale): Cookie
    {
        return cookie(
            PreferredLocale::COOKIE,
            $locale,
            60 * 24 * 365,
            '/',
            null,
            request()->isSecure(),
            true,
            false,
            'lax',
        );
    }
}
