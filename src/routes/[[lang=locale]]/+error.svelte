<script lang="ts">
  import { page } from '$app/state';
  import { _ } from 'svelte-i18n';
  import ErrorPageContent from '$lib/ErrorPageContent.svelte';
  import ErrorPageHead from '$lib/ErrorPageHead.svelte';
  import type { AppLocale } from '$lib/merge-messages';
  import { appPath } from '$lib/paths';
  import type { LayoutData } from './$types';

  let { data } = $props() as { data: LayoutData };
  const loc = $derived((data as LayoutData | undefined)?.locale ?? 'en');
  const st = $derived(page.status);
  const homeHref = $derived(appPath(loc as AppLocale, 'home'));
</script>

<ErrorPageHead
  title={$_('meta.title.error')}
  description={$_('meta.desc.error')}
/>
<ErrorPageContent
  status={st}
  title={st === 404 ? $_('error.title_404') : st >= 500 ? $_('error.title_5xx') : $_('error.title_4xx')}
  lead={st === 404 ? $_('error.lead_404') : st >= 500 ? $_('error.lead_5xx') : $_('error.lead_4xx')}
  homeLabel={$_('error.cta_home')}
  {homeHref}
/>
