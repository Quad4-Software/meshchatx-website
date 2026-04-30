<script lang="ts">
  import ContactContent from '$lib/ContactContent.svelte';
  import MetaTags from '$lib/MetaTags.svelte';
  import type { PageData } from './$types';
  const { data } = $props() as { data: PageData };
</script>

<MetaTags page="contact" locale={data.locale} />
<ContactContent />
