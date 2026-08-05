@php
    $page = 'roadmap';
    $items = $items ?? [];
    $statusKeys = [
        'done' => 'roadmap.status_done',
        'progress' => 'roadmap.status_progress',
        'planned' => 'roadmap.status_planned',
        'upcoming' => 'roadmap.status_upcoming',
    ];
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('roadmap.h1') }}</h1>
            <p class="page-hero__lead">{{ t('roadmap.lead') }}</p>
            <p class="section__lead" style="margin-top:1rem" role="note">{{ t('roadmap.notice') }}</p>
        </div>
    </section>

    <section class="section section--tight">
        <div class="site-container site-container--narrow">
            <div class="roadmap">
                @foreach ($items as $index => $item)
                    @php
                        $status = $item['status'] ?? 'planned';
                        $statusLabel = t($statusKeys[$status] ?? 'roadmap.status_planned');
                        $versionId = 'v-'.str_replace('.', '-', (string) ($item['version'] ?? $index));
                    @endphp
                    <article class="roadmap__item{{ $status === 'done' ? ' is-done' : '' }}" id="{{ $versionId }}">
                        <span class="roadmap__status">{{ $statusLabel }}</span>
                        <h2 class="roadmap__title">
                            v{{ $item['version'] ?? '' }}
                            @if (! empty($item['title']))
                                · {{ $item['title'] }}
                            @endif
                        </h2>
                        @if (! empty($item['date']))
                            <p class="roadmap__body">{{ $item['date'] }}</p>
                        @endif
                        @if (! empty($item['desc']))
                            <p class="roadmap__body">{{ $item['desc'] }}</p>
                        @endif
                        @if (! empty($item['features']))
                            <ul class="roadmap__body">
                                @foreach ($item['features'] as $feature)
                                    <li>{{ is_array($feature) ? ($feature['text'] ?? '') : $feature }}</li>
                                @endforeach
                            </ul>
                        @endif
                        @if (! empty($item['notice']))
                            <p class="roadmap__body">{{ $item['notice'] }}</p>
                        @endif
                    </article>
                @endforeach
            </div>
        </div>
    </section>
@endsection
