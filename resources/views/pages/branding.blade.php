@php
    $page = 'branding';
    $branding = $branding ?? config('meshchatx.branding', []);
    $assets = $branding['assets'] ?? [];

    $groupAssets = function (array $items): array {
        $bySize = [];
        foreach ($items as $item) {
            $size = $item['size'];
            $bySize[$size]['size'] = $size;
            $bySize[$size]['formats'][$item['format']] = $item['path'];
        }
        krsort($bySize);

        return array_values($bySize);
    };

    $lockups = $groupAssets($assets['lockup'] ?? []);
    $logos = $groupAssets($assets['logo'] ?? []);
    $icons = $groupAssets($assets['icon'] ?? []);
    $wordmarks = $groupAssets($assets['wordmark'] ?? []);

    $formatLabel = function (string $format): string {
        return strtoupper(str_replace(['jpg-', '-'], ['', ' '], $format));
    };
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('branding.h1') }}</h1>
            <p class="page-hero__lead">{{ t('branding.lead') }}</p>
        </div>
    </section>

    <section class="section section--tight" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('branding.lockup_h2') }}</h2>
                <p class="section__lead">{{ t('branding.lockup_lead') }}</p>
            </div>
            <div class="branding-grid branding-grid--lockups">
                @foreach ($lockups as $item)
                    @php
                        $preview = $item['formats']['png'] ?? $item['formats']['webp'] ?? reset($item['formats']);
                        $darkPreview = $item['formats']['png-dark'] ?? $item['formats']['jpg-dark'] ?? $preview;
                        $previewH = min($item['size'], 80);
                    @endphp
                    <article class="branding-card">
                        <div class="branding-card__preview branding-card__preview--lockup">
                            <img
                                src="{{ $preview }}"
                                alt="{{ t('brand.name') }} logo with text {{ $item['size'] }}px"
                                height="{{ $previewH }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        <div class="branding-card__preview branding-card__preview--dark branding-card__preview--lockup">
                            <img
                                src="{{ $darkPreview }}"
                                alt="{{ t('brand.name') }} logo with text on dark {{ $item['size'] }}px"
                                height="{{ $previewH }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        <div class="branding-card__meta">
                            <span class="branding-card__size">{{ $item['size'] }}px height</span>
                            <div class="branding-card__links">
                                @foreach ($item['formats'] as $format => $path)
                                    <a href="{{ $path }}" download>{{ $formatLabel($format) }}</a>
                                @endforeach
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    <section class="section" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('branding.logo_h2') }}</h2>
                <p class="section__lead">{{ t('branding.logo_lead') }}</p>
            </div>
            <div class="branding-grid">
                @foreach ($logos as $item)
                    @php
                        $preview = $item['formats']['png'] ?? $item['formats']['webp'] ?? reset($item['formats']);
                        $isDarkJpg = isset($item['formats']['jpg-dark']);
                    @endphp
                    <article class="branding-card">
                        <div class="branding-card__preview{{ $item['size'] >= 256 ? '' : '' }}">
                            <img
                                src="{{ $preview }}"
                                alt="{{ t('brand.name') }} logo {{ $item['size'] }}px"
                                width="{{ min($item['size'], 256) }}"
                                height="{{ min($item['size'], 256) }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        @if ($isDarkJpg)
                            <div class="branding-card__preview branding-card__preview--dark">
                                <img
                                    src="{{ $item['formats']['png'] ?? $preview }}"
                                    alt="{{ t('brand.name') }} logo on dark {{ $item['size'] }}px"
                                    width="{{ min($item['size'], 256) }}"
                                    height="{{ min($item['size'], 256) }}"
                                    loading="lazy"
                                    decoding="async"
                                >
                            </div>
                        @endif
                        <div class="branding-card__meta">
                            <span class="branding-card__size">{{ $item['size'] }}px</span>
                            <div class="branding-card__links">
                                @foreach ($item['formats'] as $format => $path)
                                    <a href="{{ $path }}" download>{{ strtoupper(str_replace('jpg-', '', $format)) }}</a>
                                @endforeach
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    <section class="section" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('branding.icon_h2') }}</h2>
                <p class="section__lead">{{ t('branding.icon_lead') }}</p>
            </div>
            <div class="branding-grid branding-grid--icons">
                @foreach ($icons as $item)
                    @php
                        $preview = $item['formats']['png'] ?? $item['formats']['webp'] ?? ($item['formats']['ico'] ?? reset($item['formats']));
                    @endphp
                    <article class="branding-card">
                        <div class="branding-card__preview">
                            <img
                                src="{{ $preview }}"
                                alt="{{ t('brand.name') }} icon {{ $item['size'] }}px"
                                width="{{ min($item['size'], 128) }}"
                                height="{{ min($item['size'], 128) }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        <div class="branding-card__meta">
                            <span class="branding-card__size">{{ $item['size'] }}px</span>
                            <div class="branding-card__links">
                                @foreach ($item['formats'] as $format => $path)
                                    <a href="{{ $path }}" download>{{ strtoupper(str_replace('jpg-', '', $format)) }}</a>
                                @endforeach
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    <section class="section" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('branding.wordmark_h2') }}</h2>
                <p class="section__lead">{{ t('branding.wordmark_lead') }}</p>
            </div>
            <div class="branding-grid">
                @foreach ($wordmarks as $item)
                    @php
                        $preview = $item['formats']['png'] ?? $item['formats']['webp'] ?? reset($item['formats']);
                    @endphp
                    <article class="branding-card">
                        <div class="branding-card__preview">
                            <img
                                src="{{ $preview }}"
                                alt="{{ t('brand.name') }} wordmark {{ $item['size'] }}px"
                                height="{{ min($item['size'], 80) }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        <div class="branding-card__preview branding-card__preview--dark">
                            <img
                                src="{{ $preview }}"
                                alt="{{ t('brand.name') }} wordmark on dark {{ $item['size'] }}px"
                                height="{{ min($item['size'], 80) }}"
                                loading="lazy"
                                decoding="async"
                            >
                        </div>
                        <div class="branding-card__meta">
                            <span class="branding-card__size">{{ $item['size'] }}px height</span>
                            <div class="branding-card__links">
                                @foreach ($item['formats'] as $format => $path)
                                    <a href="{{ $path }}" download>{{ strtoupper(str_replace('jpg-', '', $format)) }}</a>
                                @endforeach
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>
@endsection
