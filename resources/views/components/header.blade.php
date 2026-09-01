@php
    $homeUrl = locale_route('home');
    $downloadUrl = locale_route('download');
    $current = current_locale();
    $navItem = function (array $item) use ($homeUrl, $site): array {
        $external = false;
        $active = false;
        if (! empty($item['home_only'])) {
            $href = $homeUrl.($item['href'] ?? '');
        } elseif (! empty($item['route'])) {
            $href = locale_route($item['route']);
            $active = request()->routeIs(
                $item['route'],
                'locale.'.$item['route'],
                $item['route'].'.*',
                'locale.'.$item['route'].'.*',
            );
        } elseif (! empty($item['external'])) {
            $href = $site[$item['external']] ?? (string) config('meshchatx.'.$item['external']);
            $external = true;
        } else {
            $href = $item['href'] ?? '#';
        }

        return [
            'label' => t($item['label_key']),
            'href' => $href,
            'active' => $active,
            'external' => $external,
        ];
    };
@endphp

<div class="site-header-wrap" data-site-header>
    <header class="site-header">
        <div class="site-header__inner site-container">
            <a class="brand-mark" href="{{ $homeUrl }}">
                <img
                    class="brand-mark__img"
                    src="/logo-navbar.webp"
                    alt=""
                    width="40"
                    height="40"
                    decoding="async"
                >
                <span class="brand-mark__text">{{ t('brand.name') }}</span>
            </a>

            <nav class="site-nav" aria-label="{{ t('nav.primary') }}">
                @foreach ($site['nav'] as $item)
                    @php $link = $navItem($item); @endphp
                    <a
                        class="nav-link{{ $link['active'] ? ' is-active' : '' }}"
                        href="{{ $link['href'] }}"
                        @if ($link['external']) target="_blank" rel="noopener noreferrer" @endif
                    >{{ $link['label'] }}</a>
                @endforeach
            </nav>

            <div class="site-header__tools">
                <div class="lang-picker" data-lang-picker>
                    <button
                        type="button"
                        class="lang-picker__trigger tool-icon-btn"
                        data-lang-trigger
                        aria-expanded="false"
                        aria-haspopup="listbox"
                        aria-label="{{ t('lang.pick') }}"
                    >
                        <x-icon name="earth" size="xs" />
                    </button>
                    <div class="lang-picker__menu" role="listbox" aria-label="{{ t('lang.label') }}">
                        @foreach ($site['locales'] as $code)
                            <a
                                class="lang-picker__option{{ $code === $current ? ' is-active' : '' }}"
                                href="{{ \App\Support\LocaleUrl::switchLocale($code) }}"
                                role="option"
                                @if ($code === $current) aria-selected="true" @endif
                                hreflang="{{ $code }}"
                                lang="{{ $code }}"
                            >{{ t('lang.'.$code) }}</a>
                        @endforeach
                    </div>
                </div>

                <button
                    type="button"
                    class="theme-toggle tool-icon-btn"
                    data-theme-toggle
                    aria-label="{{ t('nav.toggle_theme') }}"
                >
                    <x-icon name="theme" size="xs" />
                </button>

                <a class="btn btn--solid btn--sm site-header__cta" href="{{ $downloadUrl }}">{{ t('nav.download') }}</a>

                <button
                    type="button"
                    class="menu-toggle"
                    data-menu-toggle
                    aria-expanded="false"
                    aria-controls="mobile-nav"
                    aria-label="{{ t('nav.mobile_menu') }}"
                    data-label-open="{{ t('nav.mobile_menu') }}"
                    data-label-close="{{ t('nav.mobile_menu_close') }}"
                >
                    <x-icon name="menu" size="xs" class="menu-toggle__icon menu-toggle__icon--open" />
                    <x-icon name="close" size="xs" class="menu-toggle__icon menu-toggle__icon--close" />
                </button>
            </div>
        </div>
    </header>

    <div class="nav-scrim" data-nav-scrim aria-hidden="true"></div>

    <nav id="mobile-nav" class="mobile-nav" data-mobile-nav aria-label="{{ t('nav.mobile_nav') }}" aria-hidden="true">
        <div class="mobile-nav__inner site-container">
            @foreach ($site['nav'] as $item)
                @php $link = $navItem($item); @endphp
                <a
                    class="nav-link{{ $link['active'] ? ' is-active' : '' }}"
                    href="{{ $link['href'] }}"
                    @if ($link['external']) target="_blank" rel="noopener noreferrer" @endif
                >{{ $link['label'] }}</a>
            @endforeach
            <a class="btn btn--solid mobile-nav__download" href="{{ $downloadUrl }}">{{ t('nav.download') }}</a>
        </div>
    </nav>
</div>
