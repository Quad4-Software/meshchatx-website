<script lang="ts">
  import HomeContent from '$lib/HomeContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<MetaTags page="home" locale={data.locale} />
<HomeContent locale={data.locale} releases={data.releasesPayload} />
