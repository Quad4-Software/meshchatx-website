@php
    $groups = [
        'product' => [],
        'explore' => [],
        'legal' => [],
    ];
    foreach ($site['footer_nav'] as $item) {
        $group = $item['group'] ?? 'explore';
        if (! array_key_exists($group, $groups)) {
            $group = 'explore';
        }
        if (! empty($item['external'])) {
            $groups[$group][] = [
                'label' => t($item['label_key']),
                'href' => $site[$item['external']] ?? config('meshchatx.'.$item['external']),
                'external' => true,
                'route' => null,
            ];
        } elseif (! empty($item['route'])) {
            $groups[$group][] = [
                'label' => t($item['label_key']),
                'href' => locale_route($item['route']),
                'external' => false,
                'route' => $item['route'],
            ];
        }
    }

    $columns = [
        ['key' => 'product', 'heading' => t('footer.product'), 'links' => $groups['product']],
        ['key' => 'explore', 'heading' => t('footer.explore'), 'links' => $groups['explore']],
        ['key' => 'legal', 'heading' => t('footer.legal'), 'links' => $groups['legal']],
    ];

    $metaSite = clean_site_html(t('footer.meta_site'));
    $metaSite = preg_replace('/href="[^"]*"/', 'href="'.e($site['quad4_url']).'"', $metaSite) ?? $metaSite;
    if (str_contains($metaSite, 'class="')) {
        $metaSite = preg_replace('/\s*class="[^"]*"/', ' class="site-footer__link"', $metaSite) ?? $metaSite;
    } else {
        $metaSite = preg_replace('/<a\b/', '<a class="site-footer__link"', $metaSite, 1) ?? $metaSite;
    }
@endphp

<footer class="site-footer">
    <div class="site-container">
        <div class="site-footer__top">
            <div>
                <a class="site-footer__brand-mark" href="{{ locale_route('home') }}">
                    <img
                        class="site-footer__logo"
                        src="/logo-navbar.webp"
                        alt=""
                        width="40"
                        height="40"
                        decoding="async"
                    >
                    <span class="site-footer__brand">{{ t('brand.name') }}</span>
                </a>
                <p class="site-footer__tagline">{{ t('footer.tagline') }}</p>
            </div>
            <div class="site-footer__columns">
                @foreach ($columns as $column)
                    <div>
                        <h2 class="site-footer__heading">{{ $column['heading'] }}</h2>
                        <div class="site-footer__links">
                            @foreach ($column['links'] as $link)
                                <a
                                    class="site-footer__link"
                                    href="{{ $link['href'] }}"
                                    @if (! empty($link['external'])) target="_blank" rel="noopener noreferrer" @endif
                                >
                                    {{ $link['label'] }}
                                    @if (($link['route'] ?? '') === 'license')
                                        <span>{{ t('footer.license_badge') }}</span>
                                    @endif
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
        <div class="site-footer__bottom">
            <p>{{ t('footer.meta_copyright') }}</p>
            <p>{!! $metaSite !!}</p>
        </div>
    </div>
</footer>
