<script lang="ts">
  import { page } from '$app/state';
  import ErrorPageContent from '$lib/ErrorPageContent.svelte';
  import ErrorPageHead from '$lib/ErrorPageHead.svelte';
  import { rootErrorCopy } from '$lib/error-messages';

  const st = $derived(page.status);
  const copy = $derived(rootErrorCopy(st));
</script>

<ErrorPageHead
  title="Error | MeshChatX"
  description="The page could not be shown as requested."
/>
<ErrorPageContent
  status={st}
  title={copy.title}
  lead={copy.lead}
  homeLabel="Back to home"
  homeHref="/"
/>
