@props([
    'page' => 'home',
    'title' => null,
    'description' => null,
    'canonical' => null,
    'routeName' => null,
    'routeParams' => [],
])

@php
    $locale = current_locale();
    $title = is_string($title) && $title !== '' ? $title : t("meta.title.{$page}");
    $desc = is_string($description) && $description !== '' ? $description : t("meta.desc.{$page}");
    $brand = t('brand.name');
    $ogAlt = t('meta.og_image_alt');
    $domain = rtrim($site['domain'], '/');
    $isError = $page === 'error';
    $routeName = is_string($routeName) && $routeName !== '' ? $routeName : ($isError ? 'home' : $page);
    $routeParams = is_array($routeParams) ? $routeParams : [];
    $canonical = is_string($canonical) && $canonical !== ''
        ? $canonical
        : ($isError ? url()->current() : locale_route($routeName, $routeParams));
    $logoUrl = $domain.'/logo.webp';
    $ogLocales = $site['og_locales'] ?? [];
    $ogLocale = $ogLocales[$locale] ?? 'en_US';
    $locales = $site['locales'] ?? ['en'];
    $robots = $isError || $page === 'offline'
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    $orgId = $domain.'/#organization';
    $siteId = $domain.'/#website';
    $pageId = $canonical.'#webpage';
    $appId = $domain.'/#software';

    $graph = [
        [
            '@type' => 'Organization',
            '@id' => $orgId,
            'name' => $brand,
            'url' => $domain,
            'logo' => [
                '@type' => 'ImageObject',
                'url' => $logoUrl,
                'caption' => $brand,
            ],
        ],
        [
            '@type' => 'WebSite',
            '@id' => $siteId,
            'name' => $brand,
            'url' => $domain,
            'inLanguage' => $locales,
            'publisher' => ['@id' => $orgId],
        ],
        [
            '@type' => 'WebPage',
            '@id' => $pageId,
            'name' => $title,
            'url' => $canonical,
            'description' => $desc,
            'isPartOf' => ['@id' => $siteId],
            'inLanguage' => $locale,
            'isFamilyFriendly' => true,
        ],
    ];

    if ($page === 'home') {
        $graph[] = [
            '@type' => 'SoftwareApplication',
            '@id' => $appId,
            'name' => $brand,
            'applicationCategory' => 'CommunicationApplication',
            'operatingSystem' => 'Windows, macOS, Linux, Android',
            'url' => $domain,
            'downloadUrl' => locale_route('download'),
            'offers' => [
                '@type' => 'Offer',
                'price' => '0',
                'priceCurrency' => 'USD',
            ],
            'publisher' => ['@id' => $orgId],
        ];
    }

    if (! $isError && $page !== 'home') {
        $crumbLabel = match ($page) {
            'download' => t('nav.download'),
            'contact' => t('nav.contact'),
            'donate' => t('nav.donate'),
            'license' => t('footer.license'),
            'privacy' => t('footer.privacy'),
            'roadmap' => t('nav.roadmap'),
            'changelog' => t('footer.changelog'),
            'branding' => t('nav.branding'),
            'git' => t('nav.git'),
            'interfaces' => t('nav.interfaces'),
            'docs' => t('nav.docs'),
            'offline' => t('offline.h1'),
            default => ucfirst($page),
        };
        $crumbs = [
            [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => $brand,
                'item' => locale_route('home'),
            ],
            [
                '@type' => 'ListItem',
                'position' => 2,
                'name' => $crumbLabel,
                'item' => $page === 'docs' ? locale_route('docs') : $canonical,
            ],
        ];
        if ($page === 'docs' && ! empty($routeParams['slug'])) {
            $crumbs[] = [
                '@type' => 'ListItem',
                'position' => 3,
                'name' => $title,
                'item' => $canonical,
            ];
        }
        $graph[] = [
            '@type' => 'BreadcrumbList',
            '@id' => $canonical.'#breadcrumbs',
            'itemListElement' => $crumbs,
        ];
    }

    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => $graph,
    ];
@endphp

<title>{{ $title }}</title>
<meta name="description" content="{{ $desc }}">
<link rel="canonical" href="{{ $canonical }}">
@unless ($isError)
    @foreach ($locales as $code)
        <link rel="alternate" hreflang="{{ $code }}" href="{{ locale_route($routeName, $routeParams, $code) }}">
    @endforeach
    <link rel="alternate" hreflang="x-default" href="{{ locale_route($routeName, $routeParams, $site['default_locale'] ?? 'en') }}">
@endunless
<meta name="robots" content="{{ $robots }}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ $brand }}">
<meta property="og:title" content="{{ $title }}">
<meta property="og:description" content="{{ $desc }}">
<meta property="og:url" content="{{ $canonical }}">
<meta property="og:image" content="{{ $logoUrl }}">
<meta property="og:image:alt" content="{{ $ogAlt }}">
<meta property="og:locale" content="{{ $ogLocale }}">
@unless ($isError)
    @foreach ($locales as $code)
        @if ($code !== $locale)
            <meta property="og:locale:alternate" content="{{ $ogLocales[$code] ?? $code }}">
        @endif
    @endforeach
@endunless
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $title }}">
<meta name="twitter:description" content="{{ $desc }}">
<meta name="twitter:image" content="{{ $logoUrl }}">
<meta name="twitter:image:alt" content="{{ $ogAlt }}">
<meta id="mcx-theme-color" name="theme-color" content="#fafafa">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{{ $brand }}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/webp" href="/favicon.webp">
<link rel="apple-touch-icon" href="/logo.webp">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="sitemap" type="application/xml" title="Sitemap" href="{{ $domain }}/sitemap.xml">
<link rel="describedby" href="{{ $domain }}/llms.txt" title="llms.txt">
@if (($page ?? '') === 'docs' && ! empty($routeParams['slug']))
    <link
        rel="alternate"
        type="text/markdown"
        title="Markdown"
        href="{{ locale_route('docs.markdown', ['slug' => $routeParams['slug']]) }}"
    >
    <link rel="describedby" href="{{ $domain }}/docs/llms.txt" title="docs llms.txt">
@endif
@if (($page ?? '') === 'changelog')
    <link
        rel="alternate"
        type="application/rss+xml"
        title="{{ t('changelog.rss_title') }}"
        href="{{ $domain }}/changelog.xml"
    >
@endif
<script type="application/ld+json">{!! str_replace('<', '\u003c', json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) !!}</script>
