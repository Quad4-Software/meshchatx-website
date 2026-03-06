<script>
  import Icon from '$lib/components/Icon.svelte';
  import { site } from '$lib/config.js';
  import { mdiMessageTextOutline, mdiContentCopy, mdiCheck } from '@mdi/js';

  let copied = $state(false);
  const lxmfAddress = "7cc8d66b4f6a0e0e49d34af7f6077b5a";

  function copyAddress() {
    navigator.clipboard?.writeText(lxmfAddress).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }

  const contactPageUrl = site.url + '/contact';
  const contactPageTitle = 'Contact | MeshChatX';
  const contactPageDesc = 'Contact the MeshChatX dev via LXMF (Reticulum messaging).';
</script>

<svelte:head>
  <title>{contactPageTitle}</title>
  <meta name="description" content={contactPageDesc} />
  <meta property="og:title" content={contactPageTitle} />
  <meta property="og:description" content={contactPageDesc} />
  <meta property="og:url" content={contactPageUrl} />
  <meta name="twitter:title" content={contactPageTitle} />
  <meta name="twitter:description" content={contactPageDesc} />
</svelte:head>

<section class="px-6 pb-24">
  <div class="max-w-2xl mx-auto text-center">
    <div class="inline-flex items-center justify-center size-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-8">
      <Icon path={mdiMessageTextOutline} size="32" />
    </div>
    <h1 class="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-zinc-900 dark:text-white">Contact</h1>

    <div class="glass-card p-8 text-left border-blue-500/20">
      <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-4">Contact via LXMF</h2>
      <div class="relative group">
        <div class="block w-full px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 break-all pr-12">
          {lxmfAddress}
        </div>
        <button
          type="button"
          class="absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
          onclick={copyAddress}
          title="Copy LXMF address"
        >
          <Icon path={copied ? mdiCheck : mdiContentCopy} size="16" />
        </button>
      </div>
    </div>
  </div>
</section>
