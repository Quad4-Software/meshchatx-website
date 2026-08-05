@php
    $page = 'donate';
    $xmr = $site['donate']['xmr'] ?? '';
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero page-hero--center">
        <div class="site-container site-container--narrow">
            <h1 class="page-hero__title">{{ t('donate.h1') }}</h1>
            <p class="page-hero__lead">{{ t('donate.lead') }}</p>
            <p class="page-hero__lead"><strong>{{ t('donate.xmr_only') }}</strong></p>
        </div>
    </section>

    <section class="section section--tight">
        <div class="site-container site-container--narrow">
            <div class="donate-panel">
                <div class="donate-panel__row donate-panel__row--first">
                    <p class="donate-panel__label">{{ t('donate.monero') }}</p>
                    <button
                        type="button"
                        class="copyable-address"
                        data-copy-text="{{ $xmr }}"
                        data-copied-label="{{ t('donate.copied') }}"
                        aria-label="{{ t('donate.copy_xmr') }}"
                    >{{ $xmr }}</button>
                    <p class="donate-panel__hint">{{ t('donate.click_copy') }}</p>
                </div>

                <div class="donate-panel__row">
                    <p class="donate-panel__label">{{ t('donate.platforms_title') }}</p>
                    <div class="donate-panel__actions">
                        <a class="btn btn--ghost" href="{{ $site['donate']['kofi'] }}" target="_blank" rel="noopener noreferrer">{{ t('donate.kofi') }}</a>
                        <a class="btn btn--ghost" href="{{ $site['donate']['bmac'] }}" target="_blank" rel="noopener noreferrer">{{ t('donate.bmac') }}</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
