<script lang="ts">
  import { FLAT, type AppLocale } from '$lib/merge-messages';
  import { buildPageJsonLd } from '$lib/seo';
  import { canonicalForLocale, SITE_ORIGIN, type PageId } from '$lib/paths';
  const { page, locale: loc } = $props<{
    page: PageId;
    locale: AppLocale;
  }>();
  const d = $derived((FLAT[loc as AppLocale] as Record<string, string>) || {});
  const tTitle = $derived(d['meta.title.' + page] ?? `meta.title.${page}`);
  const tDesc = $derived(d['meta.desc.' + page] ?? `meta.desc.${page}`);
  const tBrand = $derived(d['brand.name'] ?? 'brand.name');
  const tOg = $derived(d['meta.og_image_alt'] ?? 'meta.og_image_alt');
  const can = $derived(canonicalForLocale(loc, page));
  const img = `${SITE_ORIGIN}/logo.webp`;
  const ogL = (l: AppLocale) => (l === 'en' ? 'en_US' : l === 'de' ? 'de_DE' : l === 'ru' ? 'ru_RU' : 'it_IT');
  const jsonLd = $derived(
    buildPageJsonLd({
      page,
      loc,
      title: tTitle,
      description: tDesc,
      brand: tBrand,
      logoUrl: img,
      pageUrl: can,
    })
  );
</script>

<svelte:head>
  <title>{tTitle}</title>
  <meta name="description" content={tDesc} />
  <link rel="sitemap" type="application/xml" title="Sitemap" href={`${SITE_ORIGIN}/sitemap.xml`} />
  <link rel="canonical" href={can} />
  <link rel="alternate" hreflang="en" href={canonicalForLocale('en', page)} />
  <link rel="alternate" hreflang="de" href={canonicalForLocale('de', page)} />
  <link rel="alternate" hreflang="ru" href={canonicalForLocale('ru', page)} />
  <link rel="alternate" hreflang="it" href={canonicalForLocale('it', page)} />
  <link rel="alternate" hreflang="x-default" href={canonicalForLocale('en', page)} />
  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={tBrand} />
  <meta property="og:title" content={tTitle} />
  <meta property="og:description" content={tDesc} />
  <meta property="og:url" content={can} />
  <meta property="og:image" content={img} />
  <meta property="og:image:alt" content={tOg} />
  <meta property="og:locale" content={ogL(loc)} />
  {#if loc !== 'en'}
    <meta property="og:locale:alternate" content="en_US" />
  {/if}
  {#if loc !== 'de'}
    <meta property="og:locale:alternate" content="de_DE" />
  {/if}
  {#if loc !== 'ru'}
    <meta property="og:locale:alternate" content="ru_RU" />
  {/if}
  {#if loc !== 'it'}
    <meta property="og:locale:alternate" content="it_IT" />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={tTitle} />
  <meta name="twitter:description" content={tDesc} />
  <meta name="twitter:image" content={img} />
  <meta name="twitter:image:alt" content={tOg} />
  {@html
    '<script type="application/ld+json">' +
    JSON.stringify(jsonLd).replace(/</g, '\\u003c') +
    '</' +
    'script>'}
</svelte:head>
