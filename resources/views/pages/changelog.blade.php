@php
    $page = 'changelog';
    $entries = $entries ?? [];
    $toc = $toc ?? [];
    $pagination = $pagination ?? [
        'page' => 1,
        'per_page' => 10,
        'total' => count($entries),
        'total_pages' => 1,
        'has_more' => false,
        'next_page' => null,
    ];
    $entriesUrl = $entriesUrl ?? locale_route('changelog.entries');
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('changelog.h1') }}</h1>
            <p class="page-hero__lead">{{ t('changelog.lead') }}</p>
            <div class="changelog-hero__actions">
                <a class="btn btn--ghost" href="{{ $rssUrl }}">{{ t('changelog.rss') }}</a>
                <a class="btn btn--ghost" href="{{ $sourceUrl }}" target="_blank" rel="noopener noreferrer">{{ t('changelog.source') }}</a>
            </div>
        </div>
    </section>

    <section class="section section--tight" data-reveal>
        <div class="site-container site-container--readable">
            @if ($toc === [])
                <p class="section__lead">{{ t('changelog.empty') }}</p>
            @else
                <div
                    class="changelog"
                    data-changelog
                    data-entries-url="{{ $entriesUrl }}"
                    data-page="{{ $pagination['page'] }}"
                    data-has-more="{{ $pagination['has_more'] ? '1' : '0' }}"
                    data-next-page="{{ $pagination['next_page'] ?? '' }}"
                    data-total-pages="{{ $pagination['total_pages'] }}"
                >
                    <div class="changelog-toc" aria-label="{{ t('changelog.toc') }}">
                        @foreach ($toc as $item)
                            <a class="changelog-toc__link{{ $item['released'] ? '' : ' is-unreleased' }}" href="#{{ $item['anchor'] }}" data-changelog-toc="{{ $item['anchor'] }}">
                                <span>v{{ $item['version'] }}</span>
                                <time datetime="{{ $item['date'] }}">{{ $item['date'] }}</time>
                            </a>
                        @endforeach
                    </div>

                    <ol class="changelog-list" data-changelog-list>
                        @include('partials.changelog-entries', ['entries' => $entries])
                    </ol>

                    <div class="changelog-more" data-changelog-more {{ $pagination['has_more'] ? '' : 'hidden' }}>
                        <div class="changelog-more__sentinel" data-changelog-sentinel aria-hidden="true"></div>
                        <button
                            type="button"
                            class="btn btn--ghost"
                            data-changelog-load
                            @if (! $pagination['has_more']) disabled @endif
                        >{{ t('changelog.load_more') }}</button>
                        <p class="changelog-more__status" data-changelog-status hidden>{{ t('changelog.loading') }}</p>
                    </div>
                </div>
            @endif
        </div>
    </section>
@endsection
