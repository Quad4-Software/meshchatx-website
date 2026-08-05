@props([
    'name',
    'size' => 'md',
    'class' => '',
])

@php
    $path = \App\Support\IconPaths::path($name);
    $px = match ($size) {
        'xs' => 18,
        'sm' => 24,
        'md' => 36,
        'lg', 'xl' => 48,
        default => 36,
    };
@endphp

@if ($path)
    <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mcx-icon mcx-icon--{{ $size }} {{ $class }}"
        width="{{ $px }}"
        height="{{ $px }}"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
    >
        <path fill="currentColor" d="{{ $path }}" />
    </svg>
@endif
