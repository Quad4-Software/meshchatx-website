<!DOCTYPE html>
<html lang="{{ current_locale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        (function () {
            try {
                var stored = localStorage.getItem('theme');
                var preference = stored || 'system';
                var dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', dark);
                document.documentElement.classList.toggle('light', !dark);
                document.documentElement.dataset.theme = preference;
                document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
            } catch (e) {}
        })();
    </script>
    <x-seo :page="$page ?? 'home'" />
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
