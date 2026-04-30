<script lang="ts">
  import DownloadContent from '$lib/DownloadContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import { page } from '$app/state';

  const { data } = $props() as { data: PageData };

  $effect(() => {
    if (!browser) return;
    page.url.pathname;
    page.url.search;
    void window.MCX?.initDownloadPage?.();
  });
</script>

<MetaTags page="download" locale={data.locale} />
<DownloadContent locale={data.locale} />
