<script>
  import Icon from '$lib/components/Icon.svelte';
  import { site } from '$lib/config.js';
  import { mdiHeart, mdiContentCopy, mdiCheck, mdiWallet } from '@mdi/js';

  let copied = $state(false);
  const moneroAddress = "88XnEvNTWQj1VqLhMbDXyJf69o8AZ5DTcG1xPURgPXyZipPdSftVqMnJHKjRX6njpj8rK81NcquBs6eMLkAhU3aUJQ9KQM5"; 

  function copyAddress() {
    navigator.clipboard?.writeText(moneroAddress).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }

  const donatePageUrl = site.url + '/donate';
  const donatePageTitle = 'Donate | MeshChatX';
  const donatePageDesc = 'Support MeshChatX development. We only accept Monero at this time.';
</script>

<svelte:head>
  <title>{donatePageTitle}</title>
  <meta name="description" content={donatePageDesc} />
  <meta property="og:title" content={donatePageTitle} />
  <meta property="og:description" content={donatePageDesc} />
  <meta property="og:url" content={donatePageUrl} />
  <meta name="twitter:title" content={donatePageTitle} />
  <meta name="twitter:description" content={donatePageDesc} />
</svelte:head>

<section class="px-6 pb-24">
  <div class="max-w-2xl mx-auto text-center">
    <div class="inline-flex items-center justify-center size-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-8">
      <Icon path={mdiHeart} size="32" />
    </div>
    <h1 class="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white">Support MeshChatX</h1>
    <p class="text-lg text-zinc-500 dark:text-zinc-400 mb-12 leading-relaxed">
      MeshChatX is built for the community. Your donation helps fund development and infrastructure costs. 
      <br />
      <span class="font-bold text-zinc-900 dark:text-white mt-2 inline-block">We only accept Monero (XMR) at this time.</span>
    </p>

    <div class="glass-card p-8 text-left border-orange-500/20">
      <div class="flex items-center gap-4 mb-6">
        <div class="shrink-0 size-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Icon path={mdiWallet} size="28" />
        </div>
        <div>
          <h2 class="text-xl font-black text-zinc-900 dark:text-white">Monero</h2>
        </div>
      </div>

      <div class="space-y-4">
        <div class="relative group">
          <div class="block w-full px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 break-all pr-12">
            {moneroAddress}
          </div>
          <button
            type="button"
            class="absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
            onclick={copyAddress}
            title="Copy Monero Address"
          >
            <Icon path={copied ? mdiCheck : mdiContentCopy} size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
