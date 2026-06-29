<script lang="ts">
  import { page } from '$app/state';
  import ErrorPageContent from '$lib/ErrorPageContent.svelte';
  import ErrorPageHead from '$lib/ErrorPageHead.svelte';
  import ErrorShell from '$lib/ErrorShell.svelte';
  import { rootErrorCopy } from '$lib/error-messages';
  import { appPath, localeFromPathname } from '$lib/paths';

  const st = $derived(page.status);
  const copy = $derived(rootErrorCopy(st));
  const loc = $derived(localeFromPathname(page.url?.pathname ?? '/'));
</script>

<ErrorPageHead
  title="Error | MeshChatX"
  description="The page could not be shown as requested."
/>
<ErrorShell>
  <ErrorPageContent
    status={st}
    title={copy.title}
    lead={copy.lead}
    homeLabel="Back to home"
    homeHref="/"
    downloadLabel="Download MeshChatX"
    downloadHref={appPath(loc, 'download')}
  />
</ErrorShell>
