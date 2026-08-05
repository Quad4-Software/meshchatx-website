@php
    $page = 'home';
    $downloadBase = locale_route('download');
    $gitUrl = locale_route('git');
    $firstTab = $showcaseTabs[0] ?? 'tab-11-home.webp';
    $features = [
        ['icon' => 'orbit', 'title' => 'home.feature.decentralized_h3', 'body' => 'home.feature.decentralized_p'],
        ['icon' => 'shield-lock', 'title' => 'home.feature.crypto_h3', 'body' => 'home.feature.crypto_p', 'link' => true],
        ['icon' => 'web', 'title' => 'home.feature.mesh_h3', 'body' => 'home.feature.mesh_p'],
        ['icon' => 'monitor', 'title' => 'home.feature.platform_h3', 'body' => 'home.feature.platform_p'],
        ['icon' => 'windows', 'title' => 'home.feature.sandbox_win_h3', 'body' => 'home.feature.sandbox_win_p'],
        ['icon' => 'linux', 'title' => 'home.feature.sandbox_linux_h3', 'body' => 'home.feature.sandbox_linux_p'],
    ];
    $capMarquee = [];
    foreach ($capabilities as $key) {
        $capMarquee[] = ['label' => t('home.cap.'.$key), 'more' => false];
    }
    $capMarquee[] = ['label' => t('home.cap.more'), 'more' => true];
@endphp

@extends('layouts.app')

@section('content')
    <section class="home-hero">
        <div class="home-hero__bg" aria-hidden="true">
            <img
                class="home-hero__bg-img"
                src="/vendor/reticulum-logo.png"
                alt=""
                width="512"
                height="512"
                decoding="async"
            >
        </div>

        <div class="site-container">
            <div class="home-hero__copy">
                <p class="home-hero__brand">{{ t('brand.name') }}</p>
                <h1 class="home-hero__headline">{{ t('home.hero.h1') }}</h1>
                <p class="home-hero__lead">{{ t('home.hero.lead') }}</p>

                @if (! empty($stableVersion))
                    <p class="version-badge version-badge--fade">
                        {{ t('js.home.version_here', ['s' => $stableVersion]) }}
                    </p>
                @endif

                <div class="home-hero__platforms">
                    @foreach ($site['platforms'] as $platform)
                        <a
                            class="platform-chip platform-chip--icon"
                            href="{{ $downloadBase }}#{{ $platform['hash'] }}"
                            title="{{ t('home.platform.'.$platform['key']) }}"
                            aria-label="{{ t('home.platform.'.$platform['key']) }}"
                        >
                            <x-icon :name="$platform['icon']" size="sm" />
                        </a>
                    @endforeach
                </div>

                <div class="home-hero__actions">
                    <a class="btn btn--solid" href="{{ $downloadBase }}">{{ t('home.cta.download') }}</a>
                    <a class="btn btn--ghost" href="{{ $gitUrl }}">{{ t('home.cta.source') }}</a>
                </div>
            </div>
        </div>

        <div class="home-hero__plane" id="showcase">
            <div class="home-hero__plane-inner showcase" data-showcase data-showcase-autoplay="7500">
                <div class="showcase__tabs" role="tablist" aria-label="{{ t('nav.showcase') }}">
                    @foreach ($showcaseTabs as $index => $file)
                        @php
                            $label = t('js.showcase.tab'.$index);
                            $alt = t('js.showcase.desktop_fmt', ['s' => $label]);
                        @endphp
                        <button
                            type="button"
                            class="showcase__tab{{ $index === 0 ? ' is-active' : '' }}"
                            role="tab"
                            data-showcase-tab
                            data-src="/showcase/light/{{ $file }}"
                            data-src-dark="/showcase/dark/{{ $file }}"
                            data-label="{{ $alt }}"
                            aria-selected="{{ $index === 0 ? 'true' : 'false' }}"
                        >{{ $label }}</button>
                    @endforeach
                </div>
                <div class="showcase__plane">
                    <img
                        class="home-hero__shot showcase__image"
                        data-showcase-image
                        src="/showcase/light/{{ $firstTab }}"
                        alt="{{ t('js.showcase.desktop_fmt', ['s' => t('js.showcase.tab0')]) }}"
                        width="1280"
                        height="800"
                        decoding="async"
                        fetchpriority="high"
                    >
                </div>
            </div>
        </div>
    </section>

    <section class="section section--compact section--caps" data-reveal>
        <div class="cap-marquee" data-marquee aria-label="{{ t('home.section.infra_h2') }}">
            <ul class="cap-marquee__track">
                @foreach ($capMarquee as $item)
                    <li class="cap-marquee__item{{ ! empty($item['more']) ? ' cap-marquee__item--more' : '' }}">{{ $item['label'] }}</li>
                @endforeach
            </ul>
        </div>
    </section>

    <section id="features" class="section section--compact" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('home.section.infra_h2') }}</h2>
                <p class="section__lead">{{ t('home.section.infra_lead') }}</p>
            </div>
            <div class="feature-grid feature-grid--cards">
                @foreach ($features as $feature)
                    <article class="feature-item feature-item--card">
                        <div class="feature-item__icon" aria-hidden="true">
                            <x-icon :name="$feature['icon']" size="sm" />
                        </div>
                        <h3 class="feature-item__title">{{ t($feature['title']) }}</h3>
                        <p class="feature-item__body">{{ t($feature['body']) }}</p>
                        @if (! empty($feature['link']))
                            <p class="feature-item__body">
                                <a href="{{ $site['reticulum_crypto'] }}" target="_blank" rel="noopener noreferrer">{{ t('home.feature.crypto_link') }}</a>
                            </p>
                        @endif
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    <section class="section section--compact" data-reveal>
        <div class="site-container">
            <h2 class="split-block__title">
                {{ t('home.split.h2_line1') }}<br>
                {{ t('home.split.h2_line2') }}
            </h2>
            <div class="feature-grid feature-grid--cards feature-grid--anon">
                <article class="feature-item feature-item--card">
                    <div class="feature-item__icon" aria-hidden="true"><x-icon name="account-multiple" size="sm" /></div>
                    <h3 class="feature-item__title">{{ t('home.split.item1_h4') }}</h3>
                    <p class="feature-item__body">{{ t('home.split.item1_p') }}</p>
                </article>
                <article class="feature-item feature-item--card">
                    <div class="feature-item__icon" aria-hidden="true"><x-icon name="card-account-details-outline" size="sm" /></div>
                    <h3 class="feature-item__title">{{ t('home.split.item2_h4') }}</h3>
                    <p class="feature-item__body">{{ t('home.split.item2_p') }}</p>
                </article>
                <article class="feature-item feature-item--card">
                    <div class="feature-item__icon" aria-hidden="true"><x-icon name="shield-check" size="sm" /></div>
                    <h3 class="feature-item__title">{{ t('home.split.item3_h4') }}</h3>
                    <p class="feature-item__body">{{ t('home.split.item3_p') }}</p>
                </article>
            </div>
        </div>
    </section>

    <section id="videos" class="section section--compact" data-reveal>
        <div class="site-container">
            <div class="section__intro">
                <h2 class="section__title">{{ t('home.videos.h2') }}</h2>
                <p class="section__lead">{{ t('home.videos.lead') }}</p>
            </div>
            <div class="video-grid">
                @foreach ($site['youtube'] as $video)
                    <div class="video-card">
                        <div class="video-frame">
                            <iframe
                                src="https://www.youtube.com/embed/{{ $video['id'] }}"
                                title="{{ t($video['title_key']) }}"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                referrerpolicy="strict-origin-when-cross-origin"
                                allowfullscreen
                            ></iframe>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </section>
@endsection
