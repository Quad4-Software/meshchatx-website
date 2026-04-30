<script lang="ts">
  import DownloadContent from '$lib/DownloadContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="download" locale={data.locale} />
<DownloadContent locale={data.locale} />
