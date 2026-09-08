@php
    $page = 'dependency';
    $hideFooter = true;
    $bodyClass = 'page-dep';
    $catalog = $catalog ?? ['versions' => [], 'defaultVersion' => null, 'source' => $site['github_releases'] ?? ''];
    $sbom = $sbom ?? null;
    $selectedVersion = $selectedVersion ?? ($catalog['defaultVersion'] ?? null);
    $apiCatalogUrl = $apiCatalogUrl ?? url('/api/mcx-sbom');
    $apiSbomBase = $apiSbomBase ?? url('/api/mcx-sbom');
    $versions = $catalog['versions'] ?? [];
    $stats = is_array($sbom['stats'] ?? null) ? $sbom['stats'] : null;
    $i18n = [
        'loading' => t('dep.loading'),
        'error' => t('dep.error'),
        'empty' => t('dep.empty'),
        'no_results' => t('dep.no_results'),
        'no_sbom' => t('dep.no_sbom'),
        'depends_on' => t('dep.depends_on'),
        'used_by' => t('dep.used_by'),
        'none' => t('dep.none'),
        'packages' => t('dep.stat_packages'),
        'edges' => t('dep.stat_edges'),
        'showing' => t('dep.showing'),
        'ecosystem_all' => t('dep.filter_all'),
        'manifests' => t('dep.manifests'),
        'copied' => t('dep.copied'),
        'prerelease' => t('dep.prerelease'),
        'unknown_license' => t('dep.unknown_license'),
        'matches' => t('dep.matches'),
        'more_deps' => t('dep.more_deps'),
        'deps_count' => t('dep.deps_count'),
        'copies' => t('dep.copies'),
    ];
@endphp

@extends('layouts.app')

@section('content')
    <div
        class="dep"
        data-dep
        data-catalog-url="{{ $apiCatalogUrl }}"
        data-sbom-base="{{ $apiSbomBase }}"
        data-selected="{{ $selectedVersion }}"
        data-logo="/logo.webp"
    >
        <script type="application/json" data-dep-i18n>{!! json_encode($i18n, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
        <script type="application/json" data-dep-catalog>{!! json_encode($catalog, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
        @if (is_array($sbom))
            <script type="application/json" data-dep-sbom>{!! json_encode($sbom, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
        @endif

        <header class="dep-bar">
            <div class="dep-bar__start">
                <img class="dep-bar__logo" src="/logo-navbar.webp" alt="" width="28" height="28" decoding="async">
                <h1 class="dep-bar__title">{{ t('dep.h1') }}</h1>
                <label class="dep-field dep-field--version">
                    <span class="sr-only">{{ t('dep.version') }}</span>
                    <select class="dep-select" data-dep-version @disabled($versions === [])>
                        @forelse ($versions as $row)
                            <option
                                value="{{ $row['version'] }}"
                                @selected($row['version'] === $selectedVersion || $row['tag'] === $selectedVersion)
                            >
                                {{ $row['tag'] }}{{ ! empty($row['isPrerelease']) ? ' · '.t('dep.prerelease') : '' }}
                            </option>
                        @empty
                            <option value="">{{ t('dep.no_versions') }}</option>
                        @endforelse
                    </select>
                </label>
            </div>

            <div class="dep-bar__mid">
                <label class="dep-field dep-field--search">
                    <span class="sr-only">{{ t('dep.search_label') }}</span>
                    <input
                        class="dep-search"
                        type="search"
                        data-dep-search
                        placeholder="{{ t('dep.search_placeholder') }}"
                        autocomplete="off"
                        spellcheck="false"
                        @disabled(! is_array($sbom))
                    >
                </label>
                <div class="channel-toggle dep-eco" role="group" aria-label="{{ t('dep.filter_ecosystem') }}" data-dep-ecosystems>
                    <button type="button" class="channel-toggle__btn is-active" data-dep-eco="">{{ t('dep.filter_all') }}</button>
                </div>
            </div>

            <div class="dep-bar__end">
                <div class="dep-stats" data-dep-stats @if (! $stats) hidden @endif>
                    <span class="dep-stats__item"><strong data-dep-stat-packages>{{ (int) ($stats['components'] ?? 0) }}</strong> {{ t('dep.stat_packages') }}</span>
                    <span class="dep-stats__item"><strong data-dep-stat-edges>{{ (int) ($stats['edges'] ?? 0) }}</strong> {{ t('dep.stat_edges') }}</span>
                    <span class="dep-stats__item dep-stats__item--wide" data-dep-stat-ecosystems></span>
                </div>
                <div class="dep-views channel-toggle" role="tablist" aria-label="{{ t('dep.views') }}">
                    <button type="button" class="channel-toggle__btn is-active" role="tab" aria-selected="true" data-dep-view="table">{{ t('dep.view_table') }}</button>
                    <button type="button" class="channel-toggle__btn" role="tab" aria-selected="false" data-dep-view="tree">{{ t('dep.view_tree') }}</button>
                </div>
                <a
                    class="btn btn--ghost btn--sm"
                    data-dep-download
                    href="{{ is_array($sbom) ? ($sbom['sourceUrl'] ?? '#') : '#' }}"
                    @if (! is_array($sbom) || empty($sbom['sourceUrl'])) hidden @else download target="_blank" rel="noopener noreferrer" @endif
                >{{ t('dep.download') }}</a>
                <a
                    class="btn btn--ghost btn--sm"
                    data-dep-release
                    href="{{ is_array($sbom) ? ($sbom['releaseUrl'] ?? '#') : '#' }}"
                    @if (! is_array($sbom) || empty($sbom['releaseUrl'])) hidden @else target="_blank" rel="noopener noreferrer" @endif
                >{{ t('dep.release') }}</a>
            </div>
        </header>

        <p class="dep-status" data-dep-status @if (is_array($sbom) || $versions !== []) hidden @endif>
            {{ t('dep.empty') }}
            @if (! empty($catalog['source']))
                <a href="{{ $catalog['source'] }}" target="_blank" rel="noopener noreferrer">{{ t('dep.source') }}</a>
            @endif
        </p>

        <div class="dep-frame" data-dep-layout @if (! is_array($sbom)) hidden @endif>
            <div class="dep-stage">
                <div class="dep-panel is-active" data-dep-panel="table" role="tabpanel">
                    <div class="dep-table-shell">
                        <p class="dep-table-meta" data-dep-table-meta></p>
                        <div class="dep-table-wrap" data-dep-table-wrap>
                            <table class="dep-table">
                                <thead>
                                    <tr>
                                        <th scope="col">{{ t('dep.col_name') }}</th>
                                        <th scope="col">{{ t('dep.col_version') }}</th>
                                        <th scope="col">{{ t('dep.col_ecosystem') }}</th>
                                        <th scope="col">{{ t('dep.col_license') }}</th>
                                        <th scope="col">{{ t('dep.col_type') }}</th>
                                    </tr>
                                </thead>
                                <tbody data-dep-table></tbody>
                            </table>
                            <p class="dep-empty" data-dep-table-empty hidden>{{ t('dep.no_results') }}</p>
                        </div>
                    </div>
                </div>

                <div class="dep-panel" data-dep-panel="tree" role="tabpanel" hidden>
                    <div class="dep-tree" data-dep-tree></div>
                </div>
            </div>

            <aside class="dep-inspector" data-dep-detail hidden>
                <div class="dep-inspector__head">
                    <div class="dep-inspector__brand">
                        <img class="dep-inspector__logo" data-dep-detail-logo src="/logo.webp" alt="" width="36" height="36" hidden decoding="async">
                        <h2 class="dep-inspector__title" data-dep-detail-name></h2>
                    </div>
                    <button type="button" class="btn btn--ghost btn--sm" data-dep-detail-close aria-label="{{ t('dep.close_detail') }}">{{ t('dep.close_detail') }}</button>
                </div>
                <dl class="dep-inspector__meta">
                    <div>
                        <dt>{{ t('dep.col_version') }}</dt>
                        <dd data-dep-detail-version></dd>
                    </div>
                    <div>
                        <dt>{{ t('dep.col_ecosystem') }}</dt>
                        <dd data-dep-detail-eco></dd>
                    </div>
                    <div>
                        <dt>{{ t('dep.col_license') }}</dt>
                        <dd data-dep-detail-license></dd>
                    </div>
                    <div>
                        <dt>{{ t('dep.col_type') }}</dt>
                        <dd data-dep-detail-type></dd>
                    </div>
                    <div class="dep-inspector__purl">
                        <dt>{{ t('dep.purl') }}</dt>
                        <dd>
                            <button type="button" class="dep-purl" data-dep-detail-purl data-copied-label="{{ t('dep.copied') }}"></button>
                        </dd>
                    </div>
                </dl>
                <div class="dep-inspector__lists">
                    <section>
                        <h3>{{ t('dep.depends_on') }}</h3>
                        <ul data-dep-detail-deps></ul>
                    </section>
                    <section>
                        <h3>{{ t('dep.used_by') }}</h3>
                        <ul data-dep-detail-used></ul>
                    </section>
                </div>
            </aside>
        </div>
    </div>
@endsection
