<?php

namespace App\Support;

use Illuminate\Http\Request;

class PreferredLocale
{
    public const COOKIE = 'mcx_locale';

    /**
     * @return list<string>
     */
    public static function allowed(): array
    {
        return config('meshchatx.locales', ['en']);
    }

    public static function default(): string
    {
        return (string) config('meshchatx.default_locale', 'en');
    }

    public static function fromCookie(Request $request): ?string
    {
        $value = $request->cookie(self::COOKIE);

        return self::normalize(is_string($value) ? $value : null);
    }

    public static function fromAcceptLanguage(Request $request): ?string
    {
        $header = $request->header('Accept-Language');
        if (! is_string($header) || $header === '') {
            return null;
        }

        $allowed = self::allowed();
        $candidates = [];

        foreach (explode(',', $header) as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }

            [$tag, $qValue] = array_pad(explode(';', $part, 2), 2, 'q=1');
            $tag = strtolower(trim($tag));
            $quality = 1.0;
            if (preg_match('/q\s*=\s*([0-9.]+)/i', $qValue, $match)) {
                $quality = (float) $match[1];
            }

            $candidates[] = ['tag' => $tag, 'q' => $quality];
        }

        usort($candidates, fn (array $a, array $b): int => $b['q'] <=> $a['q']);

        foreach ($candidates as $candidate) {
            $tag = $candidate['tag'];
            if ($tag === '*') {
                continue;
            }

            $primary = explode('-', $tag)[0] ?? $tag;
            $mapped = self::normalize($primary);
            if ($mapped !== null && in_array($mapped, $allowed, true)) {
                return $mapped;
            }
        }

        return null;
    }

    public static function resolve(Request $request): string
    {
        return self::fromCookie($request)
            ?? self::fromAcceptLanguage($request)
            ?? self::default();
    }

    public static function normalize(?string $locale): ?string
    {
        if (! is_string($locale) || $locale === '') {
            return null;
        }

        $locale = strtolower(trim($locale));
        $allowed = self::allowed();

        return in_array($locale, $allowed, true) ? $locale : null;
    }

    public static function isBot(Request $request): bool
    {
        $ua = strtolower((string) $request->userAgent());

        if ($ua === '') {
            return false;
        }

        return (bool) preg_match(
            '/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|linkedinbot|whatsapp|telegram|discord|preview/i',
            $ua,
        );
    }
}
