<script lang="ts">
  import DownloadContent from '$lib/DownloadContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import { page } from '$app/state';

  const { data } = $props() as { data: PageData };

  $effect(() => {
    if (!browser) return;
    void page.url.pathname;
    void page.url.search;
    void window.MCX?.initDownloadPage?.();
  });

  $effect(() => {
    if (!browser) return;
    const hash = page.url.hash;
    if (!hash.startsWith('#')) return;
    const id = hash.slice(1);
    if (!id) return;
    queueMicrotask(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
</script>

<MetaTags page="download" locale={data.locale} />
<DownloadContent locale={data.locale} />
