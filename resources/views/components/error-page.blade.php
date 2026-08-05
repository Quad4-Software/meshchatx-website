@props(['status' => 500])

@php
    $status = (int) $status;
    $copy = \App\Support\ErrorCopy::for($status);
@endphp

<section class="error-page page-hero--center" data-reveal>
    <div class="site-container site-container--narrow">
        <p class="error-page__code" aria-hidden="true">{{ $status }}</p>
        <h1 class="error-page__title">{{ $copy['title'] }}</h1>
        <p class="error-page__lead">{{ $copy['lead'] }}</p>
        <div class="error-page__actions">
            <a class="btn btn--solid" href="{{ locale_route('home') }}">{{ t('error.cta_home') }}</a>
            <a class="btn btn--ghost" href="{{ locale_route('download') }}">{{ t('error.cta_download') }}</a>
        </div>
    </div>
</section>
