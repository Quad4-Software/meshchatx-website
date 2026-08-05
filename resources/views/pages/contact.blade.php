@php
    $page = 'contact';
    $lxmf = $site['contact']['lxmf'] ?? '';
    $email = $site['contact']['email'] ?? t('contact.email');
@endphp

@extends('layouts.app')

@section('content')
    <section class="page-hero page-hero--center">
        <div class="site-container site-container--narrow">
            <h1 class="page-hero__title">{{ t('contact.h1') }}</h1>
        </div>
    </section>

    <section class="section section--tight">
        <div class="site-container site-container--narrow">
            <div class="contact-panel">
                <div class="contact-panel__row contact-panel__row--first">
                    <p class="contact-panel__label">{{ t('contact.panel_title') }}</p>
                    <button
                        type="button"
                        class="copyable-address"
                        data-copy-text="{{ $lxmf }}"
                        data-copied-label="{{ t('contact.copied') }}"
                        aria-label="{{ t('contact.copy_title') }}"
                    >{{ $lxmf }}</button>
                    <p class="contact-panel__hint">{{ t('contact.click_copy') }}</p>
                </div>

                <div class="contact-panel__row">
                    <p class="contact-panel__label">{{ t('contact.panel_email') }}</p>
                    <p class="contact-panel__meta">{{ t('contact.email_lead') }}</p>
                    <button
                        type="button"
                        class="copyable-address"
                        data-copy-text="{{ $email }}"
                        data-copied-label="{{ t('contact.copied') }}"
                        aria-label="{{ t('contact.copy_email') }}"
                    >{{ $email }}</button>
                    <p class="contact-panel__hint">{{ t('contact.click_copy') }}</p>
                </div>
            </div>
        </div>
    </section>
@endsection
