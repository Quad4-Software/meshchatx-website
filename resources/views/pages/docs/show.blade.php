@php
    $slug = $doc['slug'];
    $seoTitle = $doc['title'].' | '.t('docs.meta_suffix');
    $seoDescription = $doc['description'] !== '' ? $doc['description'] : t('meta.desc.docs');
    $seoCanonical = locale_route('docs.show', ['slug' => $slug]);
    $seoRouteName = 'docs.show';
    $seoRouteParams = ['slug' => $slug];
    $exportMd = locale_route('docs.export', ['slug' => $slug, 'format' => 'md']);
    $exportTxt = locale_route('docs.export', ['slug' => $slug, 'format' => 'txt']);
    $exportAllMd = locale_route('docs.export-all', ['format' => 'md']);
    $exportAllTxt = locale_route('docs.export-all', ['format' => 'txt']);
    $exportAllPdf = locale_route('docs.export-all', ['format' => 'pdf']);
    $exportAllEpub = locale_route('docs.export-all', ['format' => 'epub']);
@endphp

@extends('layouts.app')

@section('content')
    <div class="docs-shell" data-docs-shell>
        <aside
            id="docs-mobile-nav"
            class="docs-sidebar"
            data-docs-sidebar
            aria-label="{{ t('docs.nav_label') }}"
        >
            <div class="docs-sidebar__inner">
                <button
                    type="button"
                    class="docs-search-trigger"
                    data-docs-search-open
                    aria-haspopup="dialog"
                >
                    <x-icon name="search" size="xs" />
                    <span>{{ t('docs.search_placeholder') }}</span>
                    <kbd class="docs-search-trigger__kbd">/</kbd>
                </button>

                <nav class="docs-nav" aria-label="{{ t('docs.nav_label') }}">
                    @foreach ($docsNav as $group)
                        <div class="docs-nav__group">
                            @if ($group['label_key'] !== '')
                                <p class="docs-nav__heading">{{ t($group['label_key']) }}</p>
                            @endif
                            <ul class="docs-nav__list">
                                @foreach ($group['items'] as $item)
                                    <li>
                                        <a
                                            class="docs-nav__link{{ $item['active'] ? ' is-active' : '' }}"
                                            href="{{ $item['href'] }}"
                                            @if ($item['active']) aria-current="page" @endif
                                        >
                                            @if (! empty($item['icon']))
                                                <x-icon :name="$item['icon']" size="xs" class="docs-nav__icon" />
                                            @endif
                                            <span>{{ $item['title'] }}</span>
                                        </a>
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                    @endforeach
                </nav>

                <div class="docs-sidebar__exports">
                    <p class="docs-nav__heading">{{ t('docs.export_all') }}</p>
                    <div class="docs-export docs-export--stack" role="group" aria-label="{{ t('docs.export_all') }}">
                        <a class="docs-export__btn" href="{{ $exportAllMd }}">MD</a>
                        <a class="docs-export__btn" href="{{ $exportAllTxt }}">TXT</a>
                        <a class="docs-export__btn" href="{{ $exportAllPdf }}">PDF</a>
                        <a class="docs-export__btn" href="{{ $exportAllEpub }}">EPUB</a>
                    </div>
                </div>
            </div>
        </aside>

        <div class="docs-main">
            <div class="docs-toolbar">
                <button
                    type="button"
                    class="docs-sidebar-toggle"
                    data-docs-sidebar-toggle
                    aria-expanded="false"
                    aria-controls="docs-mobile-nav"
                >
                    <x-icon name="menu-open" size="xs" />
                    <span>{{ t('docs.menu') }}</span>
                </button>

                <nav class="docs-breadcrumb" aria-label="{{ t('docs.breadcrumb') }}">
                    <a href="{{ locale_route('home') }}">{{ t('brand.name') }}</a>
                    <span class="docs-breadcrumb__sep" aria-hidden="true">/</span>
                    <a href="{{ locale_route('docs') }}">{{ t('nav.docs') }}</a>
                    <span class="docs-breadcrumb__sep" aria-hidden="true">/</span>
                    <span aria-current="page">{{ $doc['title'] }}</span>
                </nav>

                <div class="docs-export" role="group" aria-label="{{ t('docs.export') }}">
                    <span class="docs-export__label">{{ t('docs.export') }}</span>
                    <a class="docs-export__btn" href="{{ $exportMd }}">MD</a>
                    <a class="docs-export__btn" href="{{ $exportTxt }}">TXT</a>
                </div>
            </div>

            @if (count($doc['headings']) > 0)
                <details class="docs-toc-mobile">
                    <summary class="docs-toc-mobile__summary">{{ t('docs.toc') }}</summary>
                    <ul class="docs-toc__list docs-toc-mobile__list">
                        @foreach ($doc['headings'] as $heading)
                            <li class="docs-toc__item docs-toc__item--h{{ $heading['level'] }}">
                                <a href="#{{ $heading['id'] }}">{{ $heading['text'] }}</a>
                            </li>
                        @endforeach
                    </ul>
                </details>
            @endif

            <article class="docs-article">
                <header class="docs-article__header">
                    <h1 class="docs-article__title">{{ $doc['title'] }}</h1>
                    @if ($doc['description'] !== '')
                        <p class="docs-article__lead">{{ $doc['description'] }}</p>
                    @endif
                </header>

                <div class="docs-prose prose-block">
                    {!! $doc['html'] !!}
                </div>

                <nav class="docs-pager" aria-label="{{ t('docs.pager') }}">
                    @if ($doc['prev'])
                        <a class="docs-pager__link docs-pager__link--prev" href="{{ locale_route('docs.show', ['slug' => $doc['prev']['slug']]) }}">
                            <span class="docs-pager__dir">
                                <x-icon name="chevron-left" size="xs" />
                                {{ t('docs.prev') }}
                            </span>
                            <span class="docs-pager__title">{{ $doc['prev']['title'] }}</span>
                        </a>
                    @else
                        <span></span>
                    @endif
                    @if ($doc['next'])
                        <a class="docs-pager__link docs-pager__link--next" href="{{ locale_route('docs.show', ['slug' => $doc['next']['slug']]) }}">
                            <span class="docs-pager__dir">
                                {{ t('docs.next') }}
                                <x-icon name="chevron-right" size="xs" />
                            </span>
                            <span class="docs-pager__title">{{ $doc['next']['title'] }}</span>
                        </a>
                    @endif
                </nav>
            </article>

            @if (count($doc['headings']) > 0)
                <aside class="docs-toc" aria-label="{{ t('docs.toc') }}">
                    <p class="docs-toc__heading">{{ t('docs.toc') }}</p>
                    <ul class="docs-toc__list">
                        @foreach ($doc['headings'] as $heading)
                            <li class="docs-toc__item docs-toc__item--h{{ $heading['level'] }}">
                                <a href="#{{ $heading['id'] }}">{{ $heading['text'] }}</a>
                            </li>
                        @endforeach
                    </ul>
                </aside>
            @endif
        </div>
    </div>

    <div
        class="docs-search"
        data-docs-search
        hidden
        role="dialog"
        aria-modal="true"
        aria-label="{{ t('docs.search_placeholder') }}"
    >
        <div class="docs-search__scrim" data-docs-search-close></div>
        <div class="docs-search__panel">
            <div class="docs-search__bar">
                <x-icon name="search" size="xs" />
                <input
                    type="search"
                    class="docs-search__input"
                    data-docs-search-input
                    placeholder="{{ t('docs.search_placeholder') }}"
                    autocomplete="off"
                    spellcheck="false"
                >
                <kbd class="docs-search-trigger__kbd">esc</kbd>
            </div>
            <ul class="docs-search__results" data-docs-search-results role="listbox"></ul>
            <p class="docs-search__empty" data-docs-search-empty hidden>{{ t('docs.search_empty') }}</p>
        </div>
    </div>

    <script type="application/json" data-docs-search-index>{!! json_encode($searchIndex, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
@endsection
