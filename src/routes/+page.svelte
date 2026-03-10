<script>
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { 
    mdiShieldLockOutline, 
    mdiMessageTextOutline, 
    mdiWeb, 
    mdiOrbit,
    mdiCellphone,
    mdiMonitor,
    mdiSecurity,
    mdiDownload,
    mdiPhone,
    mdiFolderSync,
    mdiRobot,
    mdiPencil,
    mdiArchive,
    mdiMap,
    mdiMagnify,
    mdiMenu,
    mdiClose,
    mdiTunnel,
    mdiFileDocument,
    mdiMessageBulleted,
    mdiAccountGroup,
    mdiAccountMultiple,
    mdiAccountCancel,
    mdiBackupRestore,
    mdiCog,
    mdiChartLine,
    mdiApple,
    mdiLinux,
    mdiMicrosoftWindows,
    mdiDocker,
    mdiLanguagePython,
    mdiAndroid
  } from '@mdi/js';

  let { data } = $props();

  const showcaseTabs = ['Home', 'Calls', 'Messages', 'Browser', 'Archives', 'Visualizer', 'Tools'];
  let activeShowcaseTab = $state(0);
  let showcaseMenuOpen = $state(false);
  let showcaseView = $state('desktop');

  onMount(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    showcaseView = mq.matches ? 'desktop' : 'mobile';
  });

  const capabilities = [
    { name: 'Messaging', icon: mdiMessageTextOutline },
    { name: 'Calls', icon: mdiPhone },
    { name: 'Browser', icon: mdiWeb },
    { name: 'File Transfer', icon: mdiFolderSync },
    { name: 'Bots', icon: mdiRobot },
    { name: 'Micron Editor', icon: mdiPencil },
    { name: 'Archiver', icon: mdiArchive },
    { name: 'Mapping', icon: mdiMap },
    { name: 'Interface Discovery', icon: mdiMagnify },
    { name: 'Multiple Identities', icon: mdiAccountMultiple },
    { name: 'Banishment', icon: mdiAccountCancel },
    { name: 'Auto Backups and Snapshots', icon: mdiBackupRestore },
    { name: 'Customizable', icon: mdiCog },
    { name: 'Telemetry (LXMF)', icon: mdiChartLine },
    { name: 'Tunnel', icon: mdiTunnel, comingSoon: true },
    { name: 'Host Pages', icon: mdiFileDocument, comingSoon: true },
    { name: 'Group Messages', icon: mdiMessageBulleted, comingSoon: true },
    { name: 'Group Calls', icon: mdiAccountGroup, comingSoon: true }
  ];

  const features = [
    {
      title: 'Decentralized',
      description: 'Built on Reticulum. No central servers, no single point of failure. Total ownership of your data.',
      icon: mdiOrbit,
      color: 'bg-blue-500'
    },
    {
      title: 'Cryptographic Primitives',
      description: 'Reticulum uses efficient, strong, and well-tested cryptographic primitives designed for safety and reliability across all platforms.',
      link: 'https://reticulum.network/crypto.html',
      icon: mdiShieldLockOutline,
      color: 'bg-emerald-500'
    },
    {
      title: 'Mesh Networking',
      description: 'Communicate across any medium. MeshChatX works over the internet, radio, LoRa, and many other mediums!',
      icon: mdiWeb,
      color: 'bg-amber-500'
    },
    {
      title: 'Platform Support',
      description: 'Officially supported on Desktop (Electron) and Web (Docker/Python). Android is available via Termux.',
      icon: mdiMonitor,
      color: 'bg-purple-500'
    }
  ];
</script>

<!-- Hero Section -->
<section class="relative overflow-hidden px-6 pt-12 pb-32 md:pt-24 md:pb-48">
  <!-- Background Blur Orbs -->
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
  </div>

  <div class="max-w-7xl mx-auto text-center">
    {#if data.version}
      <a 
        href="https://git.quad4.io/RNS-Things/MeshChatX/src/branch/master/CHANGELOG.md" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:border-blue-500/40 transition-all"
      >
        <span class="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
        <span class="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">MeshChatX v{data.version} is here</span>
      </a>
    {/if}
    
    <h1 class="text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white">
      All-in-one Reticulum Client
    </h1>
    
    <p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-6 font-medium">
      MeshChatX is a highly custom fork of the original <a href="https://github.com/liamcottle/reticulum-meshchat" target="_blank" rel="noopener noreferrer" class="underline decoration-dashed decoration-zinc-500 dark:decoration-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-zinc-700 dark:text-zinc-300">MeshChat by Liam Cottle</a>. We have added many features and improvements.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-4 mb-12">
      <a href="/download#macos" class="flex flex-col items-center gap-1 {data.platforms?.macos ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="macOS">
        <Icon path={mdiApple} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">macOS</span>
      </a>
      <a href="/download#linux" class="flex flex-col items-center gap-1 {data.platforms?.linux ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="Linux">
        <Icon path={mdiLinux} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">Linux</span>
      </a>
      <a href="/download#windows" class="flex flex-col items-center gap-1 {data.platforms?.windows ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="Windows">
        <Icon path={mdiMicrosoftWindows} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">Windows</span>
      </a>
      <a href="/download#docker" class="flex flex-col items-center gap-1 {data.platforms?.docker ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="Docker">
        <Icon path={mdiDocker} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">Docker</span>
      </a>
      <a href="/download#python" class="flex flex-col items-center gap-1 {data.platforms?.python ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="Python">
        <Icon path={mdiLanguagePython} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">Python</span>
      </a>
      <a href="/download#termux" class="flex flex-col items-center gap-1 {data.platforms?.termux ? 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-zinc-500 dark:text-zinc-500 cursor-default'}" title="Termux">
        <Icon path={mdiAndroid} size="28" />
        <span class="text-[10px] font-bold uppercase tracking-wider">Termux</span>
      </a>
    </div>

    <!-- Showcase: mobile device or desktop browser -->
    <div id="showcase" class="w-full min-w-0 max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto mb-16 px-1 sm:px-1">
      <div class="flex justify-center gap-2 mb-4">
        <button
          type="button"
          class="p-2.5 rounded-xl transition-colors {showcaseView === 'mobile'
            ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'}"
          onclick={() => (showcaseView = 'mobile')}
          title="Mobile"
          aria-label="Mobile view"
        >
          <Icon path={mdiCellphone} size="22" />
        </button>
        <button
          type="button"
          class="p-2.5 rounded-xl transition-colors {showcaseView === 'desktop'
            ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'}"
          onclick={() => (showcaseView = 'desktop')}
          title="Desktop"
          aria-label="Desktop view"
        >
          <Icon path={mdiMonitor} size="22" />
        </button>
      </div>

      {#if showcaseView === 'mobile'}
        <div class="flex justify-center">
          <div class="showcase-phone w-[min(260px,82vw)] rounded-[2rem] border-[8px] border-zinc-800 dark:border-zinc-700 bg-zinc-800 dark:bg-zinc-800 shadow-2xl shadow-black/30 overflow-hidden">
            <div class="bg-zinc-900 dark:bg-zinc-900 px-4 pt-3 pb-2 flex items-center justify-center">
              <div class="size-2 rounded-full bg-zinc-600"></div>
            </div>
            <div class="relative flex items-center gap-1.5 px-2 py-2 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 min-w-0">
              <button
                type="button"
                class="touch-manipulation p-1.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 shrink-0"
                onclick={() => (showcaseMenuOpen = !showcaseMenuOpen)}
                aria-expanded={showcaseMenuOpen}
                aria-label="Sections"
              >
                <Icon path={showcaseMenuOpen ? mdiClose : mdiMenu} size="18" />
              </button>
              <span class="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate min-w-0 flex-1 text-center">{showcaseTabs[activeShowcaseTab]}</span>
              <span class="w-6 shrink-0"></span>
              {#if showcaseMenuOpen}
                <div class="absolute top-full left-0 right-0 z-20 mt-0.5 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-b-lg shadow-xl max-h-[40vh] overflow-y-auto" role="menu">
                  {#each showcaseTabs as tab, i}
                    <button
                      type="button"
                      class="touch-manipulation w-full text-left px-3 py-2 text-xs font-bold transition-colors {activeShowcaseTab === i ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
                      onclick={() => { activeShowcaseTab = i; showcaseMenuOpen = false; }}
                      role="menuitem"
                    >
                      {tab}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <div
              class="showcase-screen bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-center aspect-[9/17] min-h-0"
              onclick={() => (showcaseMenuOpen = false)}
              role="presentation"
            >
              <div class="text-center px-2 py-4">
                <Icon path={mdiMessageTextOutline} size="32" className="text-zinc-200 dark:text-zinc-800 mx-auto mb-2" />
                <span class="text-[10px] text-zinc-500 dark:text-zinc-500 font-black tracking-widest uppercase block">Mobile — {showcaseTabs[activeShowcaseTab]}</span>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="glass-card overflow-hidden shadow-2xl shadow-blue-500/10 rounded-t-2xl max-w-full">
          <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 min-w-0">
            <div class="flex gap-1 sm:gap-1.5 shrink-0">
              <div class="size-2.5 sm:size-3 rounded-full bg-red-500/80 border border-red-500/40"></div>
              <div class="size-2.5 sm:size-3 rounded-full bg-yellow-500/80 border border-yellow-500/40"></div>
              <div class="size-2.5 sm:size-3 rounded-full bg-green-500/80 border border-green-500/40"></div>
            </div>
            <div class="flex-1 min-w-0 flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 ml-1 sm:ml-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-[10px] sm:text-xs font-medium overflow-hidden">
              <span class="opacity-80 truncate block">meshchatx</span>
            </div>
          </div>
          <div class="hidden md:flex gap-0.5 px-1 sm:px-2 pt-1.5 sm:pt-2 pb-0 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
            {#each showcaseTabs as tab, i}
              <button
                type="button"
                class="px-3 sm:px-4 py-2.5 rounded-t-lg text-xs font-bold border-b-2 shrink-0 transition-colors {activeShowcaseTab === i ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-950' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}"
                onclick={() => (activeShowcaseTab = i)}
              >
                {tab}
              </button>
            {/each}
          </div>
          <div class="md:hidden flex items-center gap-2 px-2 py-2.5 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 relative">
            <button type="button" class="touch-manipulation p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 shrink-0" onclick={() => (showcaseMenuOpen = !showcaseMenuOpen)} aria-expanded={showcaseMenuOpen} aria-label="Sections">
              <Icon path={showcaseMenuOpen ? mdiClose : mdiMenu} size="22" />
            </button>
            <span class="text-xs font-bold text-zinc-600 dark:text-zinc-300 truncate min-w-0">{showcaseTabs[activeShowcaseTab]}</span>
            {#if showcaseMenuOpen}
              <div class="absolute top-full left-0 right-0 z-10 mt-0.5 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-b-lg shadow-lg max-h-[60vh] overflow-y-auto" role="menu">
                {#each showcaseTabs as tab, i}
                  <button type="button" class="touch-manipulation w-full text-left px-4 py-3 text-sm font-bold transition-colors {activeShowcaseTab === i ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}" onclick={() => { activeShowcaseTab = i; showcaseMenuOpen = false; }} role="menuitem">{tab}</button>
                {/each}
              </div>
            {/if}
          </div>
          <div class="aspect-video bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-center min-h-[240px] sm:min-h-[280px]" onclick={() => (showcaseMenuOpen = false)} role="presentation">
            <div class="text-center px-2">
              <Icon path={mdiMessageTextOutline} size="48" className="text-zinc-200 dark:text-zinc-800 mx-auto mb-2 sm:mb-4" />
              <span class="text-zinc-500 dark:text-zinc-500 font-black tracking-widest uppercase text-xs sm:text-sm block truncate">Desktop — {showcaseTabs[activeShowcaseTab]} — Screenshot</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-y-6 gap-x-12 max-w-3xl mx-auto text-left mb-16 border-t border-zinc-200 dark:border-zinc-800/50 pt-12">
      {#each capabilities as capability}
        <div class="flex items-center gap-3 text-sm font-black uppercase tracking-widest min-w-0 {capability.comingSoon ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-500'} transition-colors">
          <div class="size-8 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 [&>svg]:shrink-0">
            <Icon path={capability.icon} size="16" />
          </div>
          <span class="min-w-0 break-words flex flex-col">
            {capability.name}
            {#if capability.comingSoon}<span class="normal-case font-medium tracking-normal text-zinc-500 dark:text-zinc-500">(coming soon)</span>{/if}
          </span>
        </div>
      {/each}
    </div>
    <p class="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-12">+ so much more</p>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="/download" class="btn-primary group">
        Download Now
      </a>
      <a href="https://git.quad4.io/RNS-Things/MeshChatX" class="px-6 py-3 rounded-2xl font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
        View Source Code
      </a>
    </div>
  </div>
</section>

<!-- Features Grid -->
<section id="features" class="px-6 py-32 bg-zinc-50 dark:bg-zinc-950/30 border-y border-zinc-200 dark:border-zinc-900">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-24">
      <h2 class="text-3xl md:text-4xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white">Decentralized Infrastructure</h2>
      <p class="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto font-medium">Built for mesh networks and censorship resistance.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each features as feature}
        <div class="p-8 glass-card hover:border-blue-500/50 transition-colors group">
          <div class="size-12 {feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
            <Icon path={feature.icon} size="24" />
          </div>
          <h3 class="text-xl font-black mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium mb-4">
            {feature.description}
          </p>
          {#if feature.link}
            <a href={feature.link} target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
              Read Specification
            </a>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Secondary Showcase -->
<section class="px-6 py-32">
  <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
    <div>
      <h2 class="text-3xl md:text-4xl font-black tracking-tight mb-8 leading-[1.1] text-zinc-900 dark:text-white">
        Resilient<br/>Identity & Sync.
      </h2>
      <div class="space-y-8">
        <div class="flex gap-6">
          <div class="shrink-0 size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-blue-600">
            <Icon path={mdiSecurity} size="24" />
          </div>
          <div>
            <h4 class="font-black mb-2 text-zinc-900 dark:text-white">No Identity Required</h4>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
              Generate multiple identities instantly. No phone number, email, or government ID needed. Ever.
            </p>
          </div>
        </div>
        <div class="flex gap-6">
          <div class="shrink-0 size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-blue-600">
            <Icon path={mdiOrbit} size="24" />
          </div>
          <div>
            <h4 class="font-black mb-2 text-zinc-900 dark:text-white">Propagation Nodes</h4>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
              Synchronize messages through the network automatically. Your messages wait for you, even when you're offline.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-center">
      <div class="aspect-[4/5] max-w-sm w-full glass-card flex items-center justify-center">
        <div class="text-center px-4">
          <Icon path={mdiSecurity} size="48" className="text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
          <span class="text-[10px] text-zinc-500 dark:text-zinc-500 font-black tracking-widest uppercase">Identity & Sync</span>
        </div>
      </div>
    </div>
  </div>
</section>


