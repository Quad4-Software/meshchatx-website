{!! '<'.'?xml version="1.0" encoding="UTF-8"?>' !!}
@php
    use App\Support\SafeText;
@endphp
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>{!! SafeText::xml($title) !!}</title>
        <link>{!! SafeText::xml($link) !!}</link>
        <description>{!! SafeText::xml($description) !!}</description>
        <language>en</language>
        <atom:link href="{!! SafeText::xml($feedUrl) !!}" rel="self" type="application/rss+xml" />
        @foreach ($entries as $entry)
            @php
                $itemLink = $link.'#'.$entry['anchor'];
                $pubDate = \Carbon\Carbon::parse($entry['date'].' 12:00:00', 'UTC')->toRssString();
                $plain = trim(preg_replace('/\s+/', ' ', strip_tags($entry['html'])) ?? '');
                if (strlen($plain) > 600) {
                    $plain = rtrim(substr($plain, 0, 597)).'...';
                }
            @endphp
            <item>
                <title>{!! SafeText::xml('MeshChatX v'.$entry['version']) !!}</title>
                <link>{!! SafeText::xml($itemLink) !!}</link>
                <guid isPermaLink="true">{!! SafeText::xml($itemLink) !!}</guid>
                <pubDate>{!! SafeText::xml($pubDate) !!}</pubDate>
                <description>{!! SafeText::xml($plain) !!}</description>
            </item>
        @endforeach
    </channel>
</rss>
