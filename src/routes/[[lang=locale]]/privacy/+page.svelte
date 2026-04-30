<script lang="ts">
  import PrivacyContent from '$lib/PrivacyContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="privacy" locale={data.locale} />
<PrivacyContent />
