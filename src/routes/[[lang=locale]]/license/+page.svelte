<script lang="ts">
  import LicenseContent from '$lib/LicenseContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<MetaTags page="license" locale={data.locale} />
<LicenseContent />
