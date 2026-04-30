<script lang="ts">
  import '$lib/register-i18n';
  import { browser } from '$app/environment';
  import { _, locale } from 'svelte-i18n';
  import { page } from '$app/state';
  import { pageIdFromPathname } from '$lib/paths';
  import SiteHeader from '$lib/SiteHeader.svelte';
  import SiteFooter from '$lib/SiteFooter.svelte';
  import IconSprite from '$lib/IconSprite.svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children } = $props() as { data: LayoutData; children: Snippet };
  $effect(() => {
    locale.set(data.locale);
  });
  $effect(() => {
    if (browser) {
      document.documentElement.lang = data.locale;
      document.body.dataset.page = String(pageId);
      document.body.dataset.locale = data.locale;
    }
  });
  const pageId = $derived(pageIdFromPathname(page.url?.pathname ?? '/'));
  const mcxI18NHead = $derived(
    '<script>window.MCX_I18N=' + data.mcxI18NJson + '<' + '/script>'
  );
</script>

<svelte:head>
  {@html mcxI18NHead}
  <script src="/js/releases.js" defer></script>
  <script src="/js/app.js" defer></script>
</svelte:head>

<a class="mcx-skip" href="#main">{$_('a11y.skip')}</a>
<div class="mcx-shell">
  <IconSprite />
  <SiteHeader locale={data.locale} />
  <main id="main" class="mcx-main">
    {@render children()}
  </main>
  <SiteFooter locale={data.locale} />
</div>
