<?php

namespace App\Support;

/**
 * Plain-text cleanup for untrusted directory and feed fields.
 */
class SafeText
{
    public static function plain(string $value, int $maxLen = 500): string
    {
        $value = str_replace("\0", '', $value);
        $value = strip_tags($value);
        $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');

        if ($maxLen > 0 && mb_strlen($value) > $maxLen) {
            $value = mb_substr($value, 0, $maxLen);
        }

        return $value;
    }

    public static function xml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
