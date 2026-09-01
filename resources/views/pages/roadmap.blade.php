@php
    $page = 'roadmap';
    $items = $items ?? [];
    $statusKeys = [
        'done' => 'roadmap.status_done',
        'progress' => 'roadmap.status_progress',
        'planned' => 'roadmap.status_planned',
        'upcoming' => 'roadmap.status_upcoming',
    ];
    $lastDoneIndex = -1;
    foreach ($items as $i => $item) {
        if (($item['status'] ?? '') === 'done') {
            $lastDoneIndex = $i;
        }
    }
    $railProgress = count($items) > 1
        ? max(0, $lastDoneIndex) / (count($items) - 1) * 100
        : ($lastDoneIndex >= 0 ? 100 : 0);
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
            @if ($items !== [])
                <nav class="roadmap-rail" style="--roadmap-count: {{ count($items) }}" aria-label="{{ t('roadmap.rail_label') }}">
                    <div class="roadmap-rail__track" aria-hidden="true">
                        <span class="roadmap-rail__progress" style="--rail-progress: {{ round($railProgress, 2) }}%"></span>
                    </div>
                    <ol class="roadmap-rail__list">
                        @foreach ($items as $index => $item)
                            @php
                                $status = $item['status'] ?? 'planned';
                                $versionId = 'v-'.str_replace('.', '-', (string) ($item['version'] ?? $index));
                                $shortVersion = preg_replace('/^(\d+\.\d+).*$/', '$1', (string) ($item['version'] ?? ''));
                            @endphp
                            <li class="roadmap-rail__item">
                                <a
                                    class="roadmap-rail__node is-{{ $status }}"
                                    href="#{{ $versionId }}"
                                >
                                    <span class="roadmap-rail__dot" aria-hidden="true"></span>
                                    <span class="roadmap-rail__version">v{{ $shortVersion !== '' ? $shortVersion : ($item['version'] ?? '') }}</span>
                                    @if (! empty($item['date']))
                                        <span class="roadmap-rail__date">{{ $item['date'] }}</span>
                                    @endif
                                </a>
                            </li>
                        @endforeach
                    </ol>
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
