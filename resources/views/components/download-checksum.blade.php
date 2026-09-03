@props([
    'sha256' => null,
])

@if (is_string($sha256) && $sha256 !== '')
    <div {{ $attributes->class('download-checksum') }}>
        <span class="download-checksum__label">{{ t('dl.sha256') }}</span>
        <button
            type="button"
            class="download-checksum__value"
            data-copy-text="{{ $sha256 }}"
            aria-label="{{ t('dl.copy_sha256') }}"
            title="{{ t('dl.copy_sha256') }}"
        >{{ $sha256 }}</button>
    </div>
@endif
