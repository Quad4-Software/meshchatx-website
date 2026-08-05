<?php

namespace App\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;

class SiteTranslator
{
    /** @var array<string, array<string, mixed>> */
    private array $catalogs = [];

    public function get(string $key, array $replace = [], ?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $value = Arr::get($this->catalog($locale), $key);

        if (! is_string($value) || $value === '') {
            $fallback = config('meshchatx.default_locale', 'en');
            if ($locale !== $fallback) {
                $value = Arr::get($this->catalog($fallback), $key);
            }
        }

        if (! is_string($value)) {
            return $key;
        }

        return $this->applyReplacements($value, $replace);
    }

    /**
     * @param  array<string, mixed>  $replace
     */
    private function applyReplacements(string $value, array $replace): string
    {
        foreach ($replace as $search => $replacement) {
            $value = str_replace('%'.$search, (string) $replacement, $value);
            $value = str_replace(':'.$search, (string) $replacement, $value);
            $value = str_replace('%s', (string) $replacement, $value);
        }

        return $value;
    }

    /**
     * @return array<string, mixed>
     */
    public function catalog(string $locale): array
    {
        if (isset($this->catalogs[$locale])) {
            return $this->catalogs[$locale];
        }

        $base = $this->loadJson($locale.'.json');
        $download = $this->loadJson($locale.'.download.json');
        $merged = array_replace_recursive($base, $download);

        if ($locale !== 'en') {
            $en = $this->catalog('en');
            $merged = $this->fillEmpty($merged, $en);
        }

        return $this->catalogs[$locale] = $merged;
    }

    /**
     * @return array<string, mixed>
     */
    private function loadJson(string $filename): array
    {
        $path = lang_path($filename);
        if (! File::exists($path)) {
            return [];
        }

        $decoded = json_decode(File::get($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  array<string, mixed>  $primary
     * @param  array<string, mixed>  $fallback
     * @return array<string, mixed>
     */
    private function fillEmpty(array $primary, array $fallback): array
    {
        foreach ($fallback as $key => $value) {
            if (! array_key_exists($key, $primary)) {
                $primary[$key] = $value;

                continue;
            }

            if (is_array($value) && is_array($primary[$key])) {
                $primary[$key] = $this->fillEmpty($primary[$key], $value);

                continue;
            }

            if ($primary[$key] === '' || $primary[$key] === null) {
                $primary[$key] = $value;
            }
        }

        return $primary;
    }
}
