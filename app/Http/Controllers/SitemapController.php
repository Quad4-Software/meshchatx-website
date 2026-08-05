<?php

namespace App\Http\Controllers;

use App\Support\LocaleUrl;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        /** @var list<string> $locales */
        $locales = config('meshchatx.locales', ['en']);
        /** @var list<string> $pages */
        $pages = config('meshchatx.sitemap', []);

        $urls = [];

        foreach ($pages as $page) {
            $alternates = [];
            foreach ($locales as $locale) {
                $alternates[] = [
                    'hreflang' => $locale,
                    'href' => LocaleUrl::route($page, [], $locale),
                ];
            }

            $xDefault = LocaleUrl::route($page, [], config('meshchatx.default_locale', 'en'));

            foreach ($locales as $locale) {
                $urls[] = [
                    'loc' => LocaleUrl::route($page, [], $locale),
                    'alternates' => $alternates,
                    'x_default' => $xDefault,
                ];
            }
        }

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
