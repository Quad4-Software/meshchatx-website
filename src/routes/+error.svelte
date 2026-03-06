<script>
  import Icon from '$lib/components/Icon.svelte';
  import { mdiAlertCircleOutline, mdiHome } from '@mdi/js';

  /** @type {import('./$types').ErrorLoad} */
  let { data } = $props();
  const status = $derived(data?.status ?? 500);
  const message = $derived(data?.message ?? 'Something went wrong.');
  const title = $derived(status === 404 ? 'Page not found' : 'Error');
</script>

<svelte:head>
  <title>{title} | MeshChatX</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="px-6 py-32 min-h-[60vh] flex items-center justify-center">
  <div class="max-w-md mx-auto text-center">
    <div class="inline-flex items-center justify-center size-20 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-8">
      <Icon path={mdiAlertCircleOutline} size="40" />
    </div>
    <p class="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">{status}</p>
    <h1 class="text-3xl md:text-4xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white">{title}</h1>
    <p class="text-zinc-500 dark:text-zinc-400 mb-8">{message}</p>
    <a href="/" class="btn-primary inline-flex items-center gap-2">
      <Icon path={mdiHome} size="20" />
      Back to home
    </a>
  </div>
</section>
