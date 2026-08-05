<?php

namespace App\Support;

use Illuminate\Http\Request;

class ErrorCopy
{
    /**
     * @return array{title: string, lead: string}
     */
    public static function for(int $status): array
    {
        return match ($status) {
            400 => [
                'title' => t('error.title_400'),
                'lead' => t('error.lead_400'),
            ],
            401 => [
                'title' => t('error.title_401'),
                'lead' => t('error.lead_401'),
            ],
            403 => [
                'title' => t('error.title_403'),
                'lead' => t('error.lead_403'),
            ],
            404 => [
                'title' => t('error.title_404'),
                'lead' => t('error.lead_404'),
            ],
            405 => [
                'title' => t('error.title_405'),
                'lead' => t('error.lead_405'),
            ],
            408 => [
                'title' => t('error.title_408'),
                'lead' => t('error.lead_408'),
            ],
            419 => [
                'title' => t('error.title_419'),
                'lead' => t('error.lead_419'),
            ],
            429 => [
                'title' => t('error.title_429'),
                'lead' => t('error.lead_429'),
            ],
            500 => [
                'title' => t('error.title_500'),
                'lead' => t('error.lead_500'),
            ],
            502 => [
                'title' => t('error.title_502'),
                'lead' => t('error.lead_502'),
            ],
            503 => [
                'title' => t('error.title_503'),
                'lead' => t('error.lead_503'),
            ],
            504 => [
                'title' => t('error.title_504'),
                'lead' => t('error.lead_504'),
            ],
            default => $status >= 500
                ? [
                    'title' => t('error.title_5xx'),
                    'lead' => t('error.lead_5xx'),
                ]
                : [
                    'title' => t('error.title_4xx'),
                    'lead' => t('error.lead_4xx'),
                ],
        };
    }

    public static function localeFromRequest(Request $request): string
    {
        $segment = $request->segment(1);
        $prefixed = config('meshchatx.prefixed_locales', []);

        if (is_string($segment) && in_array($segment, $prefixed, true)) {
            return $segment;
        }

        return (string) config('meshchatx.default_locale', 'en');
    }
}
