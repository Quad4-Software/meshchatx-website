<!DOCTYPE html>
<html lang="{{ current_locale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <script src="{{ asset('theme-boot.js') }}"></script>
    <x-seo
        :page="$page ?? 'home'"
        :title="$seoTitle ?? null"
        :description="$seoDescription ?? null"
        :canonical="$seoCanonical ?? null"
        :route-name="$seoRouteName ?? null"
        :route-params="$seoRouteParams ?? []"
    />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <a class="skip-link" href="#main">{{ t('a11y.skip') }}</a>
    <div class="site-shell">
        <x-header />
        <main id="main">
            @yield('content')
        </main>
        <x-footer />
    </div>
    <div class="pwa-toast" data-pwa-toast hidden role="status" aria-live="polite"></div>
    <script type="application/json" data-pwa-i18n>{!! json_encode([
        'updating' => t('pwa.updating'),
        'offline' => t('pwa.offline'),
        'online' => t('pwa.online'),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
</body>
</html>
