@php
    $page = 'roadmap';
    $items = $items ?? [];
    $rail = $rail ?? [];
    $railProgress = $railProgress ?? 0;
    $statusKeys = [
        'done' => 'roadmap.status_done',
        'progress' => 'roadmap.status_progress',
        'planned' => 'roadmap.status_planned',
        'upcoming' => 'roadmap.status_upcoming',
        'released' => 'roadmap.status_released',
    ];
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('roadmap.h1') }}</h1>
            <p class="page-hero__lead">{{ t('roadmap.lead') }}</p>
            <p class="section__lead roadmap-hero__note" role="note">{{ t('roadmap.notice') }}</p>
        </div>
    </section>

    <section class="section section--tight" data-reveal>
        <div class="site-container">
            @if ($rail !== [])
                <nav
                    class="roadmap-rail"
                    style="--roadmap-count: {{ count($rail) }}; --rail-progress: {{ round($railProgress, 2) }}%"
                    aria-label="{{ t('roadmap.rail_label') }}"
                    data-roadmap-rail
                >
                    <div class="roadmap-rail__scroll">
                        <div class="roadmap-rail__plot">
                            <div class="roadmap-rail__track" aria-hidden="true">
                                <span class="roadmap-rail__progress"></span>
                            </div>
                            <ol class="roadmap-rail__list">
                                @foreach ($rail as $node)
                                    @php
                                        $status = $node['status'] ?? 'planned';
                                        $type = $node['type'] ?? 'milestone';
                                        $preview = $node['preview'] ?? null;
                                        $nodeClass = $type === 'patch' ? 'is-patch' : 'is-'.$status;
                                    @endphp
                                    <li class="roadmap-rail__item{{ $type === 'patch' ? ' is-patch' : '' }}">
                                        <a
                                            class="roadmap-rail__node {{ $nodeClass }}"
                                            href="{{ $node['href'] }}"
                                            @if ($preview)
                                                data-roadmap-preview
                                                data-preview-title="{{ $preview['title'] }}"
                                                data-preview-date="{{ $preview['date'] }}"
                                                data-preview-href="{{ $preview['href'] }}"
                                                data-preview-bullets="{{ e(json_encode($preview['bullets'], JSON_UNESCAPED_UNICODE)) }}"
                                            @endif
                                        >
                                            <span class="roadmap-rail__dot" aria-hidden="true"></span>
                                            <span class="roadmap-rail__version">{{ $node['label'] }}</span>
                                            @if (! empty($node['date']))
                                                <span class="roadmap-rail__date">{{ $node['date'] }}</span>
                                            @endif
                                        </a>
                                    </li>
                                @endforeach
                            </ol>
                        </div>
                    </div>
                    <div class="roadmap-rail__tip" data-roadmap-tip hidden>
                        <p class="roadmap-rail__tip-title" data-roadmap-tip-title></p>
                        <p class="roadmap-rail__tip-date" data-roadmap-tip-date hidden></p>
                        <ul class="roadmap-rail__tip-list" data-roadmap-tip-list></ul>
                        <a class="roadmap-rail__tip-link" data-roadmap-tip-link href="#">{{ t('roadmap.changelog_preview') }}</a>
                    </div>
                </nav>
            @endif

            <ol class="roadmap-timeline">
                @foreach ($items as $index => $item)
                    @php
                        $status = $item['status'] ?? 'planned';
                        $statusLabel = t($statusKeys[$status] ?? 'roadmap.status_planned');
                        $versionId = 'v-'.str_replace('.', '-', (string) ($item['version'] ?? $index));
                    @endphp
                    <li class="roadmap-timeline__item is-{{ $status }}" id="{{ $versionId }}">
                        <div class="roadmap-timeline__meta">
                            @if (! empty($item['date']))
                                <p class="roadmap-timeline__date">{{ $item['date'] }}</p>
                            @endif
                            <span class="roadmap-timeline__status">{{ $statusLabel }}</span>
                        </div>
                        <div class="roadmap-timeline__marker" aria-hidden="true">
                            <span class="roadmap-timeline__dot"></span>
                        </div>
                        <article class="roadmap-timeline__content">
                            <h2 class="roadmap-timeline__title">
                                <span class="roadmap-timeline__version">v{{ $item['version'] ?? '' }}</span>
                                @if (! empty($item['title']))
                                    <span class="roadmap-timeline__sep" aria-hidden="true">·</span>
                                    <span class="roadmap-timeline__name">{{ $item['title'] }}</span>
                                @endif
                            </h2>
                            @if (! empty($item['desc']))
                                <p class="roadmap-timeline__body">{{ $item['desc'] }}</p>
                            @endif
                            @if (! empty($item['features']))
                                <ul class="roadmap-timeline__features">
                                    @foreach ($item['features'] as $feature)
                                        <li>{{ is_array($feature) ? ($feature['text'] ?? '') : $feature }}</li>
                                    @endforeach
                                </ul>
                            @endif
                            @if (! empty($item['notice']))
                                <p class="roadmap-timeline__body">{{ $item['notice'] }}</p>
                            @endif
                        </article>
                    </li>
                @endforeach
            </ol>
        </div>
    </section>
@endsection
