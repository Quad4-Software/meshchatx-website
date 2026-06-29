<script lang="ts">
  import '$lib/register-i18n';
  import { browser } from '$app/environment';
  import { locale, _ } from 'svelte-i18n';
  import { page } from '$app/state';
  import SiteHeader from '$lib/SiteHeader.svelte';
  import SiteFooter from '$lib/SiteFooter.svelte';
  import IconSprite from '$lib/IconSprite.svelte';
  import { localeFromPathname } from '$lib/paths';
  import type { Snippet } from 'svelte';

  let { children } = $props<{ children: Snippet }>();

  const loc = $derived(localeFromPathname(page.url?.pathname ?? '/'));

  $effect(() => {
    locale.set(loc);
  });

  $effect(() => {
    if (browser) {
      document.documentElement.lang = loc;
      document.body.dataset.page = 'error';
      document.body.dataset.locale = loc;
    }
  });
</script>

<a class="mcx-skip" href="#main">{$_('a11y.skip')}</a>
<div class="mcx-shell">
  <IconSprite />
  <SiteHeader locale={loc} />
  <main id="main" class="mcx-main">
    {@render children()}
  </main>
  <SiteFooter locale={loc} />
</div>
