<?php

namespace App\Support;

use Uri\WhatWg\Url;

final class SiteUri
{
    public static function parse(string $url): ?Url
    {
        return Url::parse($url);
    }

    public static function isHttps(string $url): bool
    {
        return (self::parse($url)?->getScheme() ?? '') === 'https';
    }

    public static function host(string $url): ?string
    {
        return self::parse($url)?->getAsciiHost();
    }

    public static function normalize(string $url): ?string
    {
        $parsed = self::parse($url);
        if ($parsed === null) {
            return null;
        }

        return $parsed->toAsciiString();
    }
}
