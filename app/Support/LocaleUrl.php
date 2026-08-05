<?php

namespace App\Support;

class LocaleUrl
{
    public static function route(string $name, array $parameters = [], ?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $prefixed = config('meshchatx.prefixed_locales', []);

        if (in_array($locale, $prefixed, true)) {
            return route('locale.'.$name, array_merge(['locale' => $locale], $parameters));
        }

        return route($name, $parameters);
    }

    public static function switchLocale(string $targetLocale): string
    {
        $route = request()->route();
        $name = $route?->getName() ?? 'home';
        $params = $route?->parameters() ?? [];

        unset($params['locale']);

        $base = $name;
        if (str_starts_with($base, 'locale.')) {
            $base = substr($base, strlen('locale.'));
        }
        if ($base === '') {
            $base = 'home';
        }

        return self::route($base, $params, $targetLocale);
    }

    public static function canonicalPath(string $routeName, ?string $locale = null): string
    {
        return self::route($routeName, [], $locale);
    }
}
