@foreach ($entries as $entry)
    <li class="changelog-entry{{ $entry['released'] ? '' : ' is-unreleased' }}" id="{{ $entry['anchor'] }}">
        <header class="changelog-entry__header">
            <h2 class="changelog-entry__title">
                <span class="changelog-entry__version">v{{ $entry['version'] }}</span>
                @if (! $entry['released'])
                    <span class="changelog-entry__badge">{{ t('changelog.unreleased') }}</span>
                @elseif ($entry['status'] === 'released')
                    <span class="changelog-entry__badge changelog-entry__badge--released">{{ t('changelog.released') }}</span>
                @endif
            </h2>
            <time class="changelog-entry__date" datetime="{{ $entry['date'] }}">{{ $entry['date'] }}</time>
        </header>
        <div class="changelog-entry__body prose-block">
            {!! $entry['html'] !!}
        </div>
    </li>
@endforeach
