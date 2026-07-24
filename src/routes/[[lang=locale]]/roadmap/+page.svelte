<script lang="ts">
  import RoadmapContent from '$lib/RoadmapContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<MetaTags page="roadmap" locale={data.locale} />
<RoadmapContent items={data.roadmapItems} />
