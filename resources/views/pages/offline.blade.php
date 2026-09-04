@php
    $page = 'offline';
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container site-container--narrow">
            <h1 class="page-hero__title">{{ t('offline.h1') }}</h1>
            <p class="page-hero__lead">{{ t('offline.lead') }}</p>
            <div class="offline-actions">
                <button type="button" class="btn" data-offline-retry>{{ t('offline.retry') }}</button>
                <a class="btn btn--ghost" href="{{ locale_route('home') }}">{{ t('offline.home') }}</a>
                <a class="btn btn--ghost" href="{{ locale_route('docs') }}">{{ t('nav.docs') }}</a>
            </div>
            <ul class="offline-list" aria-label="{{ t('offline.available') }}">
                <li><a href="{{ locale_route('home') }}">{{ t('offline.link_home') }}</a></li>
                <li><a href="{{ locale_route('download') }}">{{ t('offline.link_download') }}</a></li>
                <li><a href="{{ locale_route('docs') }}">{{ t('offline.link_docs') }}</a></li>
                <li><a href="{{ locale_route('interfaces') }}">{{ t('offline.link_interfaces') }}</a></li>
                <li><a href="{{ locale_route('changelog') }}">{{ t('offline.link_changelog') }}</a></li>
            </ul>
        </div>
    </section>
@endsection
