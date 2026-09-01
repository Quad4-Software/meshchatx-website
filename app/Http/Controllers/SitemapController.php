<?php

namespace App\Http\Controllers;

use App\Services\DocsService;
use App\Support\LocaleUrl;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __construct(private readonly DocsService $docs) {}

    public function __invoke(): Response
    {
        /** @var list<string> $locales */
        $locales = config('meshchatx.locales', ['en']);
        /** @var list<string> $pages */
        $pages = config('meshchatx.sitemap', []);

        $urls = [];

        foreach ($pages as $page) {
            $this->appendLocalizedRoute($urls, $locales, $page);
        }

        foreach ($this->docs->slugs() as $slug) {
            $this->appendLocalizedRoute($urls, $locales, 'docs.show', ['slug' => $slug]);
        }

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * @param  list<array{loc: string, alternates: list<array{hreflang: string, href: string}>, x_default: string}>  $urls
     * @param  list<string>  $locales
     * @param  array<string, string>  $parameters
     */
    private function appendLocalizedRoute(array &$urls, array $locales, string $routeName, array $parameters = []): void
    {
        $alternates = [];
        foreach ($locales as $locale) {
            $alternates[] = [
                'hreflang' => $locale,
                'href' => LocaleUrl::route($routeName, $parameters, $locale),
            ];
        }

        $xDefault = LocaleUrl::route($routeName, $parameters, config('meshchatx.default_locale', 'en'));

        foreach ($locales as $locale) {
            $urls[] = [
                'loc' => LocaleUrl::route($routeName, $parameters, $locale),
                'alternates' => $alternates,
                'x_default' => $xDefault,
            ];
        }
    }
}
