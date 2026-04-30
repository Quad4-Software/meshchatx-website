<script lang="ts">
  import DonateContent from '$lib/DonateContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="donate" locale={data.locale} />
<DonateContent />
