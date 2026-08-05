@props([
    'name',
    'size' => 'md',
    'class' => '',
])

@php
    $map = [
        'apple' => 'mdi-apple',
        'linux' => 'mdi-linux',
        'windows' => 'mdi-microsoft-windows',
        'docker' => 'mdi-docker',
        'python' => 'mdi-language-python',
        'android' => 'mdi-android',
        'github' => 'mdi-github',
        'download' => 'mdi-download',
        'theme' => 'mdi-theme-light-dark',
        'menu' => 'mdi-menu',
        'close' => 'mdi-close',
        'copy' => 'mdi-content-copy',
        'check' => 'mdi-check',
        'earth' => 'mdi-earth',
        'open' => 'mdi-open-in-new',
        'orbit' => 'mdi-orbit',
        'shield-lock' => 'mdi-shield-lock-outline',
        'web' => 'mdi-web',
        'monitor' => 'mdi-monitor',
        'account-multiple' => 'mdi-account-multiple',
        'card-account-details-outline' => 'mdi-card-account-details-outline',
        'shield-check' => 'mdi-shield-check',
        'umbrel' => 'mdi-home-assistant',
        'package-variant' => 'mdi-package-variant',
        'file-document' => 'mdi-file-document-outline',
    ];
    $icon = $map[$name] ?? 'mdi-'.$name;
    $sizeClass = match ($size) {
        'xs' => 'mdi-18px',
        'sm' => 'mdi-24px',
        'md' => 'mdi-36px',
        'lg' => 'mdi-48px',
        'xl' => 'mdi-48px',
        default => 'mdi-36px',
    };
@endphp

<span class="mdi {{ $icon }} {{ $sizeClass }} mcx-icon {{ $class }}" aria-hidden="true"></span>
