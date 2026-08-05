@php
    $community = [];
    $legal = [];
    foreach ($site['footer_nav'] as $item) {
        if (! empty($item['external'])) {
            $community[] = [
                'label' => t($item['label_key']),
                'href' => $site[$item['external']] ?? config('meshchatx.'.$item['external']),
                'external' => true,
            ];
        } elseif (! empty($item['route'])) {
            $entry = [
                'label' => t($item['label_key']),
                'href' => locale_route($item['route']),
                'external' => false,
                'route' => $item['route'],
            ];
            if (in_array($item['route'], ['license', 'privacy'], true)) {
                $legal[] = $entry;
            } else {
                $community[] = $entry;
            }
        }
    }
    $community[] = ['label' => t('nav.roadmap'), 'href' => locale_route('roadmap'), 'external' => false];
    $community[] = ['label' => t('nav.donate'), 'href' => locale_route('donate'), 'external' => false];
    $community[] = ['label' => t('nav.contact'), 'href' => locale_route('contact'), 'external' => false];

    $metaSite = t('footer.meta_site');
    $metaSite = preg_replace('/href="[^"]*"/', 'href="'.e($site['quad4_url']).'"', $metaSite) ?? $metaSite;
    $metaSite = preg_replace('/\s*class="mcx-link-blue"/', ' class="site-footer__link"', $metaSite) ?? $metaSite;
    $metaSite = preg_replace('/\s*style="[^"]*"/', '', $metaSite) ?? $metaSite;
@endphp

<footer class="site-footer">
    <div class="site-container">
        <div class="site-footer__top">
            <div>
                <a class="site-footer__brand-mark" href="{{ locale_route('home') }}">
                    <img
                        class="site-footer__logo"
                        src="/logo-navbar.webp"
                        alt="{{ t('brand.name') }}"
                        width="120"
                        height="40"
                        decoding="async"
                    >
                    <span class="site-footer__brand">{{ t('brand.name') }}</span>
                </a>
                <p class="site-footer__tagline">{{ t('footer.tagline') }}</p>
            </div>
            <div class="site-footer__columns">
                <div>
                    <h2 class="site-footer__heading">{{ t('footer.community') }}</h2>
                    <div class="site-footer__links">
                        @foreach ($community as $link)
                            <a
                                class="site-footer__link"
                                href="{{ $link['href'] }}"
                                @if (! empty($link['external'])) target="_blank" rel="noopener noreferrer" @endif
                            >{{ $link['label'] }}</a>
                        @endforeach
                    </div>
                </div>
                <div>
                    <h2 class="site-footer__heading">{{ t('footer.legal') }}</h2>
                    <div class="site-footer__links">
                        @foreach ($legal as $link)
                            <a class="site-footer__link" href="{{ $link['href'] }}">
                                {{ $link['label'] }}
                                @if (($link['route'] ?? '') === 'license')
                                    <span>{{ t('footer.license_badge') }}</span>
                                @endif
                            </a>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
        <div class="site-footer__bottom">
            <p>{{ t('footer.meta_copyright') }}</p>
            <p>{!! $metaSite !!}</p>
        </div>
    </div>
</footer>
