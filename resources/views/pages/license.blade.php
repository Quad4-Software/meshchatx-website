@php
    $page = 'license';
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container site-container--narrow">
            <h1 class="page-hero__title">{{ t('license.h1') }}</h1>
            <p class="page-hero__lead">{{ t('license.intro') }}</p>
        </div>
    </section>

    <section class="section section--tight legal-doc">
        <div class="site-container site-container--narrow">
            <div class="prose-block">
                <h2>{{ t('license.h2_website') }}</h2>
                <p>{!! nl2br(e(t('license.body'))) !!}</p>

                <h2>{{ t('license.h2_app') }}</h2>
                <p>{{ t('license.app_intro') }}</p>
                <p>{!! nl2br(e(t('license.app_body'))) !!}</p>
            </div>
        </div>
    </section>
@endsection
