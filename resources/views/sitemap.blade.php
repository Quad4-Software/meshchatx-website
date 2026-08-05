@php
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    $pages = $pages ?? ($site['sitemap'] ?? ['home', 'download', 'roadmap', 'contact', 'donate', 'license', 'privacy']);
    $locales = $site['locales'] ?? ['en'];
    $defaultLocale = $site['default_locale'] ?? 'en';
    $entries = [];
    foreach ($pages as $pageName) {
        $hreflang = [];
        $defaultHref = locale_route($pageName, [], $defaultLocale);
        foreach ($locales as $code) {
            $hreflang[] = [$code, locale_route($pageName, [], $code)];
        }
        foreach ($hreflang as [, $url]) {
            $entries[$url] = [
                'hreflang' => $hreflang,
                'default' => $defaultHref,
            ];
        }
    }
@endphp
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach ($entries as $loc => $entry)
  <url>
    <loc>{{ $loc }}</loc>
@foreach ($entry['hreflang'] as [$code, $href])
    <xhtml:link rel="alternate" hreflang="{{ $code }}" href="{{ $href }}" />
@endforeach
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ $entry['default'] }}" />
  </url>
@endforeach
</urlset>
