@php
    $page = 'privacy';
    $pContact = t('privacy.p_contact');
    $pContact = preg_replace('/href="[^"]*"/', 'href="'.e(locale_route('contact')).'"', $pContact) ?? $pContact;
    $pContact = preg_replace('/\s*class="mcx-link-blue"/', '', $pContact) ?? $pContact;
    $pContact = preg_replace('/\s*style="[^"]*"/', '', $pContact) ?? $pContact;
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container site-container--narrow">
            <h1 class="page-hero__title">{{ t('privacy.h1') }}</h1>
            <p class="legal-doc__updated">{{ t('privacy.updated') }}</p>
        </div>
    </section>

    <section class="section section--tight legal-doc">
        <div class="site-container site-container--narrow">
            <div class="prose-block">
                <p>{{ t('privacy.p_scope') }}</p>

                <h2>{{ t('privacy.h2_no_tracking') }}</h2>
                <p>{{ t('privacy.p_no_tracking') }}</p>

                <h2>{{ t('privacy.h2_cookies') }}</h2>
                <p>{{ t('privacy.p_cookies') }}</p>
                <p>{{ t('privacy.p_cookies_detail') }}</p>

                <h2>{{ t('privacy.h2_analytics') }}</h2>
                <p>{{ t('privacy.p_analytics') }}</p>
                <p>{{ t('privacy.p_analytics_detail') }}</p>

                <h2>{{ t('privacy.h2_rights') }}</h2>
                <p>{{ t('privacy.p_rights') }}</p>

                <h2>{{ t('privacy.h2_contact') }}</h2>
                <p>{!! $pContact !!}</p>
            </div>
        </div>
    </section>
@endsection
