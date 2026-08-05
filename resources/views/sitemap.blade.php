@php echo '<?xml version="1.0" encoding="UTF-8"?>'; @endphp
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach ($urls as $url)
  <url>
    <loc>{{ $url['loc'] }}</loc>
@foreach ($url['alternates'] as $alternate)
    <xhtml:link rel="alternate" hreflang="{{ $alternate['hreflang'] }}" href="{{ $alternate['href'] }}" />
@endforeach
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ $url['x_default'] }}" />
  </url>
@endforeach
</urlset>
