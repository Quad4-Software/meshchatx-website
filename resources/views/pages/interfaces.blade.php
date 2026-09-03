@php
    $page = 'interfaces';
    $directory = $directory ?? [
        'interfaces' => [],
        'count' => 0,
        'total' => 0,
        'stale' => false,
        'fetchedAt' => null,
        'source' => $site['rns_directory_url'] ?? 'https://directory.rns.recipes/',
    ];
    $items = $directory['interfaces'] ?? [];
    $total = (int) ($directory['total'] ?? count($items));
    $stale = ! empty($directory['stale']);
    $fetchedAt = is_string($directory['fetchedAt'] ?? null) ? (string) $directory['fetchedAt'] : null;
    $fetchedLabel = null;
    if ($fetchedAt !== null && $fetchedAt !== '') {
        try {
            $fetchedLabel = \Illuminate\Support\Carbon::parse($fetchedAt)->utc()->format('j M Y');
        } catch (\Throwable) {
            $fetchedLabel = $fetchedAt;
        }
    }

    $types = [];
    $networks = [];
    foreach ($items as $item) {
        $type = (string) ($item['type'] ?? '');
        $network = (string) ($item['network'] ?? '');
        if ($type !== '') {
            $types[$type] = true;
        }
        if ($network !== '') {
            $networks[$network] = true;
        }
    }
    $typeList = array_keys($types);
    sort($typeList);
    $networkOrder = ['clearnet', 'yggdrasil', 'i2p'];
    $networkList = [];
    foreach ($networkOrder as $key) {
        if (isset($networks[$key])) {
            $networkList[] = $key;
            unset($networks[$key]);
        }
    }
    $extraNetworks = array_keys($networks);
    sort($extraNetworks);
    $networkList = array_merge($networkList, $extraNetworks);

    $groups = [];
    foreach ($networkList as $network) {
        $groups[$network] = [];
    }
    $groups[''] = [];
    foreach ($items as $item) {
        $network = (string) ($item['network'] ?? '');
        if (! isset($groups[$network])) {
            $groups[$network] = [];
        }
        $groups[$network][] = $item;
    }
    if ($groups[''] === []) {
        unset($groups['']);
    }

    $typeLabel = function (string $type): string {
        $key = 'ifx.type.'.$type;
        $label = t($key);

        return $label === $key ? $type : $label;
    };
    $networkLabel = function (string $network): string {
        if ($network === '') {
            return t('ifx.network.other');
        }
        $key = 'ifx.network.'.$network;
        $label = t($key);

        return $label === $key ? $network : $label;
    };

    $apiUrl = url('/api/mcx-interfaces');
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero page-hero--compact">
        <div class="site-container site-container--wide">
            <h1 class="page-hero__title">{{ t('ifx.h1') }}</h1>
            <p class="ifx-hero-meta">
                <span>{{ t('ifx.count', ['n' => $total]) }}</span>
                <a href="{{ $directory['source'] }}" target="_blank" rel="noopener noreferrer">{{ t('ifx.source') }}</a>
                <a href="{{ $apiUrl }}">{{ t('ifx.api') }}</a>
                @if ($fetchedLabel)
                    <span>{{ t('ifx.updated', ['s' => $fetchedLabel]) }}</span>
                @endif
            </p>
            @if ($stale)
            <p class="ifx-hero-note" role="status">{{ t('ifx.stale') }}</p>
            @endif
        </div>
    </section>

    <section class="section section--tight">
        <div class="site-container site-container--wide">
            @if ($items === [])
                <p class="section__lead">{{ t('ifx.empty') }}</p>
                <p class="section__lead">
                    <a href="{{ $directory['source'] }}" target="_blank" rel="noopener noreferrer">{{ t('ifx.source') }}</a>
                </p>
            @else
                <div class="ifx" data-ifx>
                    <div class="ifx-toolbar">
                        <label class="ifx-search">
                            <span class="sr-only">{{ t('ifx.search_label') }}</span>
                            <input
                                class="ifx-search__input"
                                type="search"
                                name="q"
                                data-ifx-search
                                placeholder="{{ t('ifx.search_placeholder') }}"
                                autocomplete="off"
                                spellcheck="false"
                            >
                        </label>
                        <div class="ifx-filters">
                            <p class="ifx-filters__label" id="ifx-filter-type">{{ t('ifx.filter_type') }}</p>
                            <div class="channel-toggle" role="group" aria-labelledby="ifx-filter-type">
                                <button type="button" class="channel-toggle__btn is-active" data-ifx-type="">{{ t('ifx.filter_all') }}</button>
                                @foreach ($typeList as $type)
                                    <button type="button" class="channel-toggle__btn" data-ifx-type="{{ $type }}">{{ $typeLabel($type) }}</button>
                                @endforeach
                            </div>
                        </div>
                        <div class="ifx-filters">
                            <p class="ifx-filters__label" id="ifx-filter-network">{{ t('ifx.filter_network') }}</p>
                            <div class="channel-toggle" role="group" aria-labelledby="ifx-filter-network">
                                <button type="button" class="channel-toggle__btn is-active" data-ifx-network="">{{ t('ifx.filter_all') }}</button>
                                @foreach ($networkList as $network)
                                    <button type="button" class="channel-toggle__btn" data-ifx-network="{{ $network }}">{{ $networkLabel($network) }}</button>
                                @endforeach
                            </div>
                        </div>
                    </div>

                    <p class="ifx-status" data-ifx-status hidden>{{ t('ifx.no_results') }}</p>

                    @foreach ($groups as $network => $groupItems)
                        <section class="ifx-group" data-ifx-group="{{ $network }}">
                            <h2 class="ifx-group__title">{{ $networkLabel((string) $network) }}</h2>
                            <div class="ifx-grid">
                                @foreach ($groupItems as $item)
                                    @php
                                        $id = $item['id'] ?? $loop->index;
                                        $cfgId = 'ifx-cfg-'.$id;
                                        $endpoint = $item['host'].($item['port'] ? ':'.$item['port'] : '');
                                    @endphp
                                    <article
                                        class="ifx-card"
                                        data-ifx-card
                                        data-name="{{ $item['name'] }}"
                                        data-host="{{ $item['host'] }}"
                                        data-type="{{ $item['type'] }}"
                                        data-typename="{{ $item['typeName'] }}"
                                        data-network="{{ $item['network'] }}"
                                    >
                                        <div class="ifx-card__top">
                                            <h3 class="ifx-card__title">{{ $item['name'] }}</h3>
                                            <p class="ifx-card__host">{{ $endpoint }}</p>
                                        </div>
                                        <p class="ifx-card__meta">
                                            @if ($item['typeName'] !== '')
                                                <span class="ifx-badge">{{ $item['typeName'] }}</span>
                                            @endif
                                            @if ($item['status'] !== '')
                                                <span class="ifx-badge ifx-badge--ok">{{ $item['status'] }}</span>
                                            @endif
                                        </p>
                                        @if ($item['config'] !== '')
                                            <div class="ifx-card__config-wrap">
                                                <div class="ifx-card__actions">
                                                    <button
                                                        type="button"
                                                        class="btn btn--ghost btn--sm"
                                                        data-copy="#{{ $cfgId }}"
                                                        data-copied-label="{{ t('ifx.copied') }}"
                                                    >{{ t('ifx.copy') }}</button>
                                                </div>
                                                <details class="ifx-card__details">
                                                    <summary>{{ t('ifx.config') }}</summary>
                                                    <pre class="ifx-card__config" id="{{ $cfgId }}"><code>{{ $item['config'] }}</code></pre>
                                                </details>
                                            </div>
                                        @endif
                                    </article>
                                @endforeach
                            </div>
                        </section>
                    @endforeach
                </div>
            @endif
        </div>
    </section>
@endsection
