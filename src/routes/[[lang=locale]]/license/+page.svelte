<script lang="ts">
  import LicenseContent from '$lib/LicenseContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="license" locale={data.locale} />
<LicenseContent />
