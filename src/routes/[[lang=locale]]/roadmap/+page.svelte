<script lang="ts">
  import RoadmapContent from '$lib/RoadmapContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="roadmap" locale={data.locale} />
<RoadmapContent locale={data.locale} />
