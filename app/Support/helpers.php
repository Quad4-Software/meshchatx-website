<?php

use App\Support\LocaleUrl;
use App\Support\SiteTranslator;

if (! function_exists('t')) {
    /**
     * Translate a site message key for the active locale.
     */
    function t(string $key, array $replace = [], ?string $locale = null): string
    {
        return app(SiteTranslator::class)->get($key, $replace, $locale);
    }
}

if (! function_exists('locale_route')) {
    /**
     * Named route for the active (or given) locale. English has no prefix.
     */
    function locale_route(string $name, array $parameters = [], ?string $locale = null): string
    {
        return LocaleUrl::route($name, $parameters, $locale);
    }
}

if (! function_exists('current_locale')) {
    function current_locale(): string
    {
        return app()->getLocale();
    }
}

if (! function_exists('clean_site_html')) {
    /**
     * Strip legacy link classes and inline styles from translation HTML.
     */
    function clean_site_html(string $html): string
    {
        $html = preg_replace('/\s*class="mcx-link-blue"/', '', $html) ?? $html;

        return preg_replace('/\s*style="[^"]*"/', '', $html) ?? $html;
    }
}
