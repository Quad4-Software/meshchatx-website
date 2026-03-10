<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';
  import { mdiWeatherNight, mdiWeatherSunny, mdiMenu } from '@mdi/js';
  import { site } from '$lib/config.js';

  let { children, data } = $props();
  let isDarkMode = $state(true);
  const changelogUrl = "https://git.quad4.io/RNS-Things/MeshChatX/src/branch/master/CHANGELOG.md";
  const canonicalUrl = $derived(site.url + $page.url.pathname);
  const jsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    description: site.description,
    url: site.url,
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', url: site.url + '/#features' } }
  });

  function toggleDarkMode() {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark') || (!root.classList.contains('light') && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const wantDark = !isDark;
    root.classList.remove('dark', 'light');
    if (wantDark) {
      root.classList.add('dark');
      isDarkMode = true;
      try { localStorage.setItem('theme', 'dark'); } catch (_) {}
    } else {
      root.classList.add('light');
      isDarkMode = false;
      try { localStorage.setItem('theme', 'light'); } catch (_) {}
    }
  }

  onMount(() => {
    isDarkMode = document.documentElement.classList.contains('dark');
  });
</script>

<svelte:head>
  <title>{site.name}</title>
  <meta name="description" content={site.description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={site.name} />
  <meta property="og:description" content={site.description} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={site.url + '/logo.png'} />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={site.name} />
  <meta name="twitter:description" content={site.description} />
  <meta name="twitter:image" content={site.url + '/logo.png'} />
  {@html '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>'}
</svelte:head>

<div class="min-h-screen flex flex-col">
  <header class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/5 dark:bg-zinc-950/5">
    <a href="/" class="flex items-center gap-2">
      <img src="/logo-navbar.png" alt="MeshChatX" width="120" height="40" class="h-10 w-auto" />
      <span class="text-xl font-black tracking-tight text-zinc-900 dark:text-white">MeshChatX</span>
    </a>

    <nav class="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500 dark:text-zinc-400">
      <a href="/#features" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
      <a href="/#showcase" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Showcase</a>
      <a href="/donate" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Donate</a>
      <a href="/contact" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
    </nav>

    <div class="flex items-center gap-4">
      <button 
        type="button"
        onclick={toggleDarkMode}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        class="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-transparent dark:border-zinc-800 hidden sm:inline-flex"
      >
        <Icon path={isDarkMode ? mdiWeatherSunny : mdiWeatherNight} size="20" />
      </button>
      <a href="/download" class="btn-primary !py-2 !px-4 text-sm hidden sm:inline-flex">
        Download
      </a>
      <details class="md:hidden group/menu relative">
        <summary
          class="list-none p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800 cursor-pointer [&::-webkit-details-marker]:hidden"
          aria-label="Toggle menu"
        >
          <Icon path={mdiMenu} size="24" class="pointer-events-none" />
        </summary>
        <div class="absolute top-full right-0 mt-1 w-full max-w-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-4 px-4 flex flex-col gap-1">
          <nav class="flex flex-col gap-1 text-base font-bold">
            <a href="/#features" class="py-3 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="/#showcase" class="py-3 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Showcase</a>
            <a href="/donate" class="py-3 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Donate</a>
            <a href="/contact" class="py-3 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
          </nav>
          <div class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <button
              type="button"
              onclick={() => { toggleDarkMode(); }}
              class="py-3 px-4 rounded-xl text-left font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3"
            >
              <Icon path={isDarkMode ? mdiWeatherSunny : mdiWeatherNight} size="22" />
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </button>
            <a href="/download" class="btn-primary text-center py-3">Download</a>
          </div>
        </div>
      </details>
    </div>
  </header>

  <main class="flex-grow pt-24">
    {@render children()}
  </main>

  <footer class="py-12 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <img src="/logo-navbar.png" alt="MeshChatX" width="96" height="32" class="h-8 w-auto" />
          <span class="text-lg font-black tracking-tight text-zinc-900 dark:text-white">MeshChatX</span>
        </div>
        <p class="text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
          Secure, resilient, and unstoppable communication over the Reticulum network.
        </p>
      </div>
      <div>
        <h4 class="font-bold mb-4 text-zinc-900 dark:text-white">Community</h4>
        <ul class="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
          <li><a href="https://git.quad4.io/RNS-Things/MeshChatX" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-600 dark:text-zinc-400">Source (Gitea)</a></li>
          <li><a href={changelogUrl} target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-600 dark:text-zinc-400">Changelog</a></li>
          <li><a href="/donate" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-600 dark:text-zinc-400">Donate</a></li>
          <li><a href="/contact" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-600 dark:text-zinc-400">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold mb-4 text-zinc-900 dark:text-white">Legal</h4>
        <ul class="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
          <li>
            <a href="/license" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              License
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold tracking-widest">MIT</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-900 text-center space-y-2">
      <p class="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest">
        &copy; {new Date().getFullYear()} MeshChatX. Secure Decentralized Networking.
      </p>
      <p class="text-xs text-zinc-600 dark:text-zinc-400">
        MeshChatX is a <a href="https://quad4.io/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline text-zinc-600 dark:text-zinc-400">quad4</a> project.
      </p>
    </div>
  </footer>
</div>

