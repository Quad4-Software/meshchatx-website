<script lang="ts">
  import DonateContent from '$lib/DonateContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<MetaTags page="donate" locale={data.locale} />
<DonateContent />
