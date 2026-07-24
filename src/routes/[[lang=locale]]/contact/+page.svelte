<script lang="ts">
  import ContactContent from '$lib/ContactContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<MetaTags page="contact" locale={data.locale} />
<ContactContent />
