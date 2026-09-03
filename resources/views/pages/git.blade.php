@php
    $page = 'git';
    $hosts = [
        [
            'key' => 'rngit',
            'primary' => true,
            'title' => t('git.rngit_h3'),
            'lead' => t('git.rngit_lead'),
            'logo' => '/vendor/reticulum-logo.png',
            'commands' => [
                ['label' => t('git.clone_rns'), 'cmd' => 'git clone '.$site['rngit_rns']],
                ['label' => t('git.nomadnet'), 'cmd' => $site['rngit_nomadnet']],
            ],
        ],
        [
            'key' => 'github',
            'primary' => false,
            'title' => t('git.github_h3'),
            'lead' => t('git.github_lead'),
            'url' => $site['github_url'],
            'icon' => 'github',
            'commands' => [],
        ],
        [
            'key' => 'lavaforge',
            'primary' => false,
            'title' => t('git.lavaforge_h3'),
            'lead' => t('git.lavaforge_lead'),
            'url' => $site['lavaforge_url'],
            'icon' => 'package-variant',
            'commands' => [],
        ],
    ];
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero">
        <div class="site-container">
            <h1 class="page-hero__title">{{ t('git.h1') }}</h1>
            <p class="page-hero__lead">{{ t('git.lead') }}</p>
        </div>
    </section>

    <section class="section section--tight">
        <div class="site-container git-grid">
            @foreach ($hosts as $host)
                <article class="git-card{{ ! empty($host['primary']) ? ' git-card--primary' : '' }}">
                    <div class="git-card__head">
                        @if (! empty($host['logo']))
                            <img class="git-card__logo" src="{{ $host['logo'] }}" alt="" width="48" height="48" decoding="async">
                        @elseif (! empty($host['icon']))
                            <span class="git-card__icon"><x-icon :name="$host['icon']" size="sm" /></span>
                        @endif
                        <div>
                            <h2 class="git-card__title">{{ $host['title'] }}</h2>
                            @if (! empty($host['primary']))
                                <p class="git-card__badge">{{ t('git.primary_badge') }}</p>
                            @else
                                <p class="git-card__badge">{{ t('git.mirror_badge') }}</p>
                            @endif
                        </div>
                    </div>
                    <p class="git-card__lead">{{ $host['lead'] }}</p>
                    @if (! empty($host['url']))
                        <div class="git-card__actions">
                            <a class="btn btn--solid btn--sm" href="{{ $host['url'] }}" target="_blank" rel="noopener noreferrer">
                                <x-icon name="open" size="xs" />
                                {{ t('git.open_repo') }}
                            </a>
                        </div>
                    @endif
                    @if (! empty($host['commands']))
                        <div class="git-card__clones">
                            @foreach ($host['commands'] as $command)
                                <div>
                                    <p class="git-card__clone-label">{{ $command['label'] }}</p>
                                    <button
                                        type="button"
                                        class="copyable-address"
                                        data-copy-text="{{ $command['cmd'] }}"
                                        data-copied-label="{{ t('git.copied') }}"
                                        aria-label="{{ t('git.copy_cmd') }}: {{ $command['cmd'] }}"
                                    >{{ $command['cmd'] }}</button>
                                    <p class="git-card__hint">{{ t('git.click_copy') }}</p>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </article>
            @endforeach
        </div>
    </section>
@endsection
