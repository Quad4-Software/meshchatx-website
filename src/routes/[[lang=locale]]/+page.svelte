<script lang="ts">
  import HomeContent from '$lib/HomeContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="home" locale={data.locale} />
<HomeContent locale={data.locale} />
