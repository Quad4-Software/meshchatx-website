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
</body>
</html>
