<script lang="ts">
  import PrivacyContent from '$lib/PrivacyContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<MetaTags page="privacy" locale={data.locale} />
<PrivacyContent />
