@props([
    'icons' => [],
])

@php
    /** @var list<array{file: string, label: string}> $icons */
@endphp

<summary {{ $attributes->class(['download-advanced__summary']) }}>
    <span class="download-advanced__label">{{ t('dl.more_options') }}</span>
    @if ($icons !== [])
        <span class="download-advanced__icons" aria-hidden="true">
            @foreach ($icons as $icon)
                <span
                    class="download-advanced__icon"
                    title="{{ $icon['label'] }}"
                    style="mask-image:url('/vendor/platforms/{{ $icon['file'] }}.svg');-webkit-mask-image:url('/vendor/platforms/{{ $icon['file'] }}.svg')"
                ></span>
            @endforeach
        </span>
    @endif
</summary>
