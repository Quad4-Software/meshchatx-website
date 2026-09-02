<?php

namespace App\Support;

/**
 * Whitelist sanitizer for markdown-rendered HTML.
 */
class SafeHtml
{
    /**
     * @var list<string>
     */
    private const ALLOWED_TAGS = [
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'em', 'del', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ];

    /**
     * @var array<string, list<string>>
     */
    private const ALLOWED_ATTRS = [
        'a' => ['href', 'title', 'rel', 'target', 'class'],
        'img' => ['src', 'alt', 'title'],
        'code' => ['class'],
        'pre' => ['class'],
        'h1' => ['id'],
        'h2' => ['id'],
        'h3' => ['id'],
        'h4' => ['id'],
        'h5' => ['id'],
        'h6' => ['id'],
        'th' => ['align'],
        'td' => ['align'],
    ];

    public static function sanitize(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $dom = new \DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="mcx-safe-root">'.$html.'</div>',
            LIBXML_NONET,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $dom->getElementById('mcx-safe-root');
        if ($root === null) {
            return '';
        }

        self::scrubChildren($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $dom->saveHTML($child);
        }

        return $out;
    }

    private static function scrubChildren(\DOMElement $parent): void
    {
        $children = [];
        foreach ($parent->childNodes as $child) {
            $children[] = $child;
        }

        foreach ($children as $child) {
            if ($child instanceof \DOMText) {
                continue;
            }

            if (! $child instanceof \DOMElement) {
                $parent->removeChild($child);

                continue;
            }

            $tag = strtolower($child->tagName);
            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                while ($child->firstChild !== null) {
                    $parent->insertBefore($child->firstChild, $child);
                }
                $parent->removeChild($child);
                self::scrubChildren($parent);

                return;
            }

            self::scrubAttributes($child, $tag);
            self::scrubChildren($child);
        }
    }

    private static function scrubAttributes(\DOMElement $el, string $tag): void
    {
        $allowed = self::ALLOWED_ATTRS[$tag] ?? [];
        $names = [];
        if ($el->hasAttributes()) {
            foreach ($el->attributes as $attr) {
                $names[] = $attr->name;
            }
        }

        foreach ($names as $name) {
            $lower = strtolower($name);
            if (! in_array($lower, $allowed, true)) {
                $el->removeAttribute($name);

                continue;
            }

            $value = (string) $el->getAttribute($name);
            if (($lower === 'href' || $lower === 'src') && ! self::isSafeUri($value, $lower === 'href')) {
                $el->removeAttribute($name);
            }

            if ($lower === 'target' && $value !== '_blank') {
                $el->removeAttribute($name);
            }
        }

        if ($tag === 'a' && $el->getAttribute('target') === '_blank') {
            $rel = trim((string) $el->getAttribute('rel'));
            $parts = array_values(array_filter(preg_split('/\s+/', $rel) ?: []));
            foreach (['noopener', 'noreferrer'] as $token) {
                if (! in_array($token, $parts, true)) {
                    $parts[] = $token;
                }
            }
            $el->setAttribute('rel', implode(' ', $parts));
        }
    }

    private static function isSafeUri(string $uri, bool $allowRelative): bool
    {
        $uri = trim(html_entity_decode($uri, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($uri === '') {
            return false;
        }

        if ($allowRelative && (str_starts_with($uri, '/') || str_starts_with($uri, '#'))) {
            return ! str_contains($uri, ':');
        }

        if (! preg_match('#\A([a-z][a-z0-9+.-]*):#i', $uri, $matches)) {
            return $allowRelative;
        }

        $scheme = strtolower($matches[1]);

        return in_array($scheme, ['http', 'https', 'mailto'], true);
    }
}
