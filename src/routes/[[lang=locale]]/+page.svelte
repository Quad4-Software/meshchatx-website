<script lang="ts">
  import HomeContent from '$lib/HomeContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import { page } from '$app/state';

  const { data } = $props() as { data: PageData };

  $effect(() => {
    if (!browser) return;
    void page.url.pathname;
    void page.url.search;
    void page.url.hash;
    void window.MCX?.initShowcaseRoots?.();
  });
</script>

<MetaTags page="home" locale={data.locale} />
<HomeContent locale={data.locale} />
