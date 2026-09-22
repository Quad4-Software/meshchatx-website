<?php

use App\Support\LocaleUrl;
use App\Support\SafeHtml;
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
     * Sanitize translation HTML (whitelist tags) and drop legacy link chrome.
     */
    function clean_site_html(string $html): string
    {
        $html = SafeHtml::sanitize($html);
        $html = preg_replace('/\s*class="mcx-link-blue"/', '', $html) ?? $html;

        return preg_replace('/\s*style="[^"]*"/', '', $html) ?? $html;
    }
}

if (! function_exists('theme_boot_script')) {
    /**
     * Theme bootstrap JS, inlined in the head so first paint does not wait on a
     * render-blocking request. SecurityHeaders whitelists it via CSP hash.
     */
    function theme_boot_script(): string
    {
        static $script = null;

        if ($script === null) {
            $script = trim((string) file_get_contents(public_path('theme-boot.js')));
        }

        return $script;
    }
}
