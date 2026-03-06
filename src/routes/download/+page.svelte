<script>
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { site } from '$lib/config.js';
  import {
    mdiApple,
    mdiLinux,
    mdiMicrosoftWindows,
    mdiDocker,
    mdiLanguagePython,
    mdiAndroid,
    mdiDownload,
    mdiPackageVariant,
    mdiContentCopy,
    mdiCheck,
    mdiCubeOutline,
    mdiScriptTextOutline,
    mdiArch,
    mdiSourceCommit
  } from '@mdi/js';

  let { data } = $props();
  let activeTab = $state('linux');
  let dockerPodmanTab = $state('docker');
  let linuxTab = $state('appimage');
  let copied = $state(null);
  const selectedRelease = $derived(data.selectedRelease ?? {});
  const selectedChannel = $derived(data.selectedChannel ?? 'stable');

  function getChannelHref(channel) {
    const query = channel === 'prerelease' ? '?channel=prerelease' : '';
    return `/download${query}#${activeTab}`;
  }

  function getTabHref(tabId) {
    const query = selectedChannel === 'prerelease' ? '?channel=prerelease' : '';
    return `/download${query}#${tabId}`;
  }

  const COMPOSE_YAML = `services:
    reticulum-meshchatx:
        container_name: reticulum-meshchatx
        image: \${MESHCHAT_IMAGE:-git.quad4.io/rns-things/meshchatx:latest}
        restart: unless-stopped
        security_opt:
            - no-new-privileges:true
        ports:
            - 127.0.0.1:8000:8000
        volumes:
            - ./meshchat-config:/config`;

  function getRunCommand(engine) {
    return `${engine} run -d \\
  --name reticulum-meshchatx \\
  --restart unless-stopped \\
  --security-opt no-new-privileges:true \\
  -p 127.0.0.1:8000:8000 \\
  -v ./meshchat-config:/config \\
  git.quad4.io/rns-things/meshchatx:latest`;
  }

  const TABS = [
    { id: 'macos', label: 'macOS', icon: mdiApple },
    { id: 'linux', label: 'Linux', icon: mdiLinux },
    { id: 'windows', label: 'Windows', icon: mdiMicrosoftWindows },
    { id: 'docker', label: 'Docker / Podman', icon: mdiDocker },
    { id: 'python', label: 'Python', icon: mdiLanguagePython },
    { id: 'termux', label: 'Termux', icon: mdiAndroid }
  ];

  function formatRelativeTime(publishedAt) {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  }

  function detectPlatform() {
    if (typeof navigator === 'undefined') return 'linux';
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() ?? '';
    if (ua.includes('win') || platform.includes('win32') || platform.includes('win64')) return 'windows';
    if (ua.includes('mac') || platform.includes('mac')) return 'macos';
    if (ua.includes('linux') || platform.includes('linux')) return 'linux';
    return 'linux';
  }

  function setTabFromHash() {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash && TABS.some((t) => t.id === hash)) {
      activeTab = hash;
    } else {
      const platform = detectPlatform();
      if (TABS.some((t) => t.id === platform)) {
        activeTab = platform;
      }
    }
  }

  onMount(() => {
    setTabFromHash();
    window.addEventListener('popstate', setTabFromHash);
    return () => window.removeEventListener('popstate', setTabFromHash);
  });

  function copyToClipboard(text, id) {
    navigator.clipboard?.writeText(text).then(() => {
      copied = id;
      setTimeout(() => (copied = null), 2000);
    });
  }

  const downloadPageUrl = site.url + '/download';
  const downloadPageTitle = 'Download | MeshChatX';
  const downloadPageDesc = 'Download MeshChatX for Windows, Linux, macOS, Docker, or Python. Decentralized messaging over Reticulum.';
  const downloadJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MeshChatX',
    applicationCategory: 'CommunicationApplication',
    description: downloadPageDesc,
    url: downloadPageUrl,
    offers: { '@type': 'Offer', price: '0' }
  };
</script>

<svelte:head>
  <title>{downloadPageTitle}</title>
  <meta name="description" content={downloadPageDesc} />
  <meta property="og:title" content={downloadPageTitle} />
  <meta property="og:description" content={downloadPageDesc} />
  <meta property="og:url" content={downloadPageUrl} />
  <meta name="twitter:title" content={downloadPageTitle} />
  <meta name="twitter:description" content={downloadPageDesc} />
  {@html '<script type="application/ld+json">' + JSON.stringify(downloadJsonLd) + '</script>'}
</svelte:head>

<section class="px-6 pb-24">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-zinc-900 dark:text-white">Download</h1>
    <div class="mb-10 space-y-1">
      <p class="text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
        {#if selectedRelease.version}
          Latest {selectedChannel === 'prerelease' ? 'pre-release' : 'stable'}: v{selectedRelease.version}
          <span class="text-[10px] px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            {selectedChannel === 'prerelease' ? 'pre-release' : 'stable'}
          </span>
          {#if selectedRelease.releaseUrl}
            <a href={selectedRelease.releaseUrl} target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">All releases</a>
          {/if}
          {#if selectedRelease.publishedAt}
            <span class="text-emerald-600 dark:text-emerald-500 text-sm">
              {formatRelativeTime(selectedRelease.publishedAt)}
            </span>
          {/if}
          {#if data.hasPreRelease}
            <span class="inline-flex items-center gap-1 ml-2">
              <a
                href={getChannelHref('stable')}
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors {selectedChannel === 'stable' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              >
                Stable
              </a>
              <a
                href={getChannelHref('prerelease')}
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors {selectedChannel === 'prerelease' ? 'bg-purple-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              >
                Pre-release
              </a>
            </span>
          {/if}
        {:else if data.error}
          <span class="text-amber-600 dark:text-amber-400">{data.error}</span>
        {:else}
          Loading release info...
        {/if}
      </p>
      {#if selectedRelease.version}
        <a href="https://git.quad4.io/RNS-Things/MeshChatX/releases/download/v{selectedRelease.version}/sbom.cyclonedx.json" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest">SBOM</a>
      {/if}
    </div>

    <div class="flex flex-wrap gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
      {#each TABS as tab}
        <a
          href={getTabHref(tab.id)}
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all {activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
          onclick={(e) => { e.preventDefault(); activeTab = tab.id; history.replaceState(null, '', getTabHref(tab.id)); }}
        >
          <Icon path={tab.icon} size="18" />
          {tab.label}
        </a>
      {/each}
    </div>

    <div class="space-y-8">
      {#if activeTab === 'macos'}
        <div id="macos" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon path={mdiApple} size="24" />
            macOS
          </h2>
          <p class="text-zinc-500 dark:text-zinc-400 mb-4">Electron macOS build coming soon.</p>
          <span class="inline-block px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-4">Coming soon</span>
          <p class="text-zinc-500 dark:text-zinc-400 text-sm">
            For now you can use <a href={getTabHref('python')} class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Python</a> or <a href={getTabHref('docker')} class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Docker</a>.
          </p>
        </div>
      {/if}

      {#if activeTab === 'linux'}
        <div id="linux" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            Linux
            <span class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-auto">AppImage and DEB: AMD64 / ARM64, RPM: AMD64</span>
          </h2>

          <!-- Sub-tabs for Linux -->
          <div class="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {linuxTab === 'appimage'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (linuxTab = 'appimage')}
            >
              <Icon path={mdiPackageVariant} size="16" />
              AppImage
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {linuxTab === 'debian'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (linuxTab = 'debian')}
            >
              <Icon path={mdiCubeOutline} size="16" />
              Debian (.deb)
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {linuxTab === 'rpm'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (linuxTab = 'rpm')}
            >
              <Icon path={mdiPackageVariant} size="16" />
              RPM (.rpm)
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {linuxTab === 'arch'
                ? 'bg-cyan-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (linuxTab = 'arch')}
            >
              <Icon path={mdiArch} size="16" />
              Arch
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {linuxTab === 'source'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (linuxTab = 'source')}
            >
              <Icon path={mdiSourceCommit} size="16" />
              From Source
            </button>
          </div>

          {#if linuxTab === 'appimage'}
            <div class="space-y-6">
              <p class="text-zinc-500 dark:text-zinc-400">Portable build, no package manager required. Download the architecture you need.</p>
              <div class="flex flex-wrap gap-4">
                {#if selectedRelease.appImageAmd64Url}
                  <a href={selectedRelease.appImageAmd64Url} class="btn-primary inline-flex items-center gap-2" download>
                    <Icon path={mdiDownload} size="20" />
                    AppImage (AMD64)
                  </a>
                {/if}
                {#if selectedRelease.appImageArm64Url}
                  <a
                    href={selectedRelease.appImageArm64Url}
                    class="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all inline-flex items-center gap-2"
                    download
                  >
                    <Icon path={mdiDownload} size="20" />
                    AppImage (ARM64)
                  </a>
                {/if}
              </div>
              {#if !selectedRelease.appImageAmd64Url && !selectedRelease.appImageArm64Url}
                <span class="text-zinc-500 dark:text-zinc-400 text-sm">No AppImage assets in latest release.</span>
              {/if}
              <div class="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Install / Run</p>
                <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">chmod +x MeshChatX-*.AppImage
./MeshChatX-*.AppImage</pre>
              </div>
            </div>
          {:else if linuxTab === 'debian'}
            <div class="space-y-6">
              <p class="text-zinc-500 dark:text-zinc-400">Debian and Ubuntu package builds for both AMD64 and ARM64.</p>
              <div class="flex flex-wrap gap-4">
                {#if selectedRelease.debAmd64Url}
                  <a href={selectedRelease.debAmd64Url} class="btn-primary inline-flex items-center gap-2" download>
                    <Icon path={mdiDownload} size="20" />
                    .deb (AMD64)
                  </a>
                {/if}
                {#if selectedRelease.debArm64Url}
                  <a
                    href={selectedRelease.debArm64Url}
                    class="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all inline-flex items-center gap-2"
                    download
                  >
                    <Icon path={mdiDownload} size="20" />
                    .deb (ARM64)
                  </a>
                {/if}
              </div>
              {#if !selectedRelease.debAmd64Url && !selectedRelease.debArm64Url}
                <span class="text-zinc-500 dark:text-zinc-400 text-sm">No Debian packages in latest release.</span>
              {/if}
              <div class="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Install</p>
                <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">sudo apt install ./MeshChatX-*.deb
# fallback if apt cannot resolve dependencies:
sudo dpkg -i MeshChatX-*.deb
sudo apt -f install</pre>
              </div>
            </div>
          {:else if linuxTab === 'rpm'}
            <div class="space-y-6">
              <p class="text-zinc-500 dark:text-zinc-400">RPM package for 64-bit x86 systems.</p>
              <div class="flex flex-wrap gap-4">
                {#if selectedRelease.rpmAmd64Url}
                  <a href={selectedRelease.rpmAmd64Url} class="btn-primary inline-flex items-center gap-2" download>
                    <Icon path={mdiDownload} size="20" />
                    .rpm (AMD64)
                  </a>
                {:else}
                  <span class="text-zinc-500 dark:text-zinc-400 text-sm">No RPM package in latest release.</span>
                {/if}
              </div>
              <div class="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Install</p>
                <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">sudo dnf install ./MeshChatX-*.rpm
# or on openSUSE:
sudo zypper install ./MeshChatX-*.rpm</pre>
              </div>
            </div>
          {:else if linuxTab === 'arch'}
            <div class="space-y-6">
              <p class="text-zinc-500 dark:text-zinc-400">Build and install manually using our PKGBUILD. This method handles dependencies and integrates with <code>pacman</code>.</p>
              
              <div class="space-y-4">
                <div>
                  <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">1. Clone & Navigate</p>
                  <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">git clone https://git.quad4.io/RNS-Things/MeshChatX
cd MeshChatX/packaging/arch</pre>
                </div>

                <div>
                  <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">2. Build & Install</p>
                  <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">makepkg -si</pre>
                </div>
              </div>

              <div class="pt-2">
                <a href="https://git.quad4.io/RNS-Things/MeshChatX/src/branch/master/packaging/arch/PKGBUILD" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                  View PKGBUILD
                </a>
              </div>
            </div>
          {:else if linuxTab === 'source'}
            <div class="space-y-6">
              <p class="text-zinc-500 dark:text-zinc-400">If you want to run MeshChatX from the source code locally:</p>
              
              <div class="space-y-4">
                <div>
                  <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">1. Clone Repository</p>
                  <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">git clone https://git.quad4.io/RNS-Things/MeshChatX
cd MeshChatX</pre>
                </div>

                <div>
                  <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">2. Build Frontend (Node.js/pnpm)</p>
                  <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">corepack enable
pnpm install
pnpm run build-frontend</pre>
                </div>

                <div>
                  <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">3. Run Backend (Python 3.10+/Poetry)</p>
                  <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">pip install poetry
poetry install
poetry run meshchat --headless --host 127.0.0.1</pre>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'windows'}
        <div id="windows" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon path={mdiMicrosoftWindows} size="24" />
            Windows 10 / 11
            <span class="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-auto">64bit only</span>
          </h2>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">Installer or portable build.</p>
          <div class="flex flex-wrap gap-4">
            {#if selectedRelease.winInstallerUrl}
              <a href={selectedRelease.winInstallerUrl} class="btn-primary inline-flex items-center gap-2" download>
                <Icon path={mdiDownload} size="20" />
                Installer
              </a>
            {/if}
            {#if selectedRelease.winPortableUrl}
              <a
                href={selectedRelease.winPortableUrl}
                class="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all inline-flex items-center gap-2"
                download
              >
                <Icon path={mdiPackageVariant} size="20" />
                Portable
              </a>
            {/if}
          </div>
          {#if !selectedRelease.winInstallerUrl && !selectedRelease.winPortableUrl}
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">No Windows assets in latest release.</span>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'docker'}
        <div id="docker" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            Containers
          </h2>

          <!-- Sub-tabs for Docker/Podman/Compose -->
          <div class="flex gap-2 mb-6">
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {dockerPodmanTab === 'docker'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (dockerPodmanTab = 'docker')}
            >
              <Icon path={mdiDocker} size="16" />
              Docker
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {dockerPodmanTab === 'podman'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (dockerPodmanTab = 'podman')}
            >
              <Icon path={mdiCubeOutline} size="16" />
              Podman
            </button>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all {dockerPodmanTab === 'compose'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
              onclick={() => (dockerPodmanTab = 'compose')}
            >
              <Icon path={mdiScriptTextOutline} size="16" />
              Compose
            </button>
          </div>

          {#if dockerPodmanTab === 'compose'}
            <p class="text-zinc-500 dark:text-zinc-400 mb-6">
              Standard <code>docker-compose.yml</code> for easy deployment.
            </p>
            <div class="relative">
              <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 overflow-x-auto border border-zinc-200 dark:border-zinc-900 leading-relaxed">{COMPOSE_YAML}</pre>
              <button
                type="button"
                class="absolute top-3 right-3 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
                onclick={() => copyToClipboard(COMPOSE_YAML, 'docker-compose')}
                title="Copy Compose"
              >
                <Icon path={copied === 'docker-compose' ? mdiCheck : mdiContentCopy} size="16" />
              </button>
            </div>
          {:else}
            <p class="text-zinc-500 dark:text-zinc-400 mb-6 flex items-center gap-2">
              Run using {dockerPodmanTab === 'docker' ? 'Docker' : 'Podman'}.
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold tracking-widest uppercase ml-auto sm:ml-0">AMD64 / ARM64</span>
            </p>
            
            <div class="space-y-6">
              <div>
                <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">Pull Image</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 break-all">
                    {dockerPodmanTab} pull git.quad4.io/rns-things/meshchatx:latest
                  </code>
                  <button
                    type="button"
                    class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors border border-zinc-300 dark:border-zinc-700"
                    onclick={() => copyToClipboard(`${dockerPodmanTab} pull git.quad4.io/rns-things/meshchatx:latest`, `${dockerPodmanTab}-pull`)}
                    title="Copy Pull"
                  >
                    <Icon path={copied === `${dockerPodmanTab}-pull` ? mdiCheck : mdiContentCopy} size="16" />
                  </button>
                </div>
              </div>

              <div class="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-3">Run Command</p>
                <div class="relative group">
                  <code class="block px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 whitespace-pre">
                    {getRunCommand(dockerPodmanTab)}
                  </code>
                  <button
                    type="button"
                    class="absolute top-3 right-3 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700"
                    onclick={() => copyToClipboard(getRunCommand(dockerPodmanTab), 'docker-run')}
                    title="Copy Run Command"
                  >
                    <Icon path={copied === 'docker-run' ? mdiCheck : mdiContentCopy} size="16" />
                  </button>
                </div>
              </div>

              <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Docker images are scanned using <a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Trivy</a>.
                </p>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'python'}
        <div id="python" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon path={mdiLanguagePython} size="24" />
            Python
          </h2>
          <p class="text-zinc-500 dark:text-zinc-400 mb-4">Pip, pipx, Poetry, or uv (bundles built frontend).</p>
          {#if selectedRelease.wheelUrl}
            <div class="space-y-4">
              <div>
                <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">pip</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    pip install {selectedRelease.wheelUrl}
                  </code>
                  <button
                    type="button"
                    class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    onclick={() => copyToClipboard(`pip install ${selectedRelease.wheelUrl}`, 'pip')}
                    title="Copy"
                  >
                    <Icon path={copied === 'pip' ? mdiCheck : mdiContentCopy} size="18" />
                  </button>
                </div>
              </div>
              <div>
                <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">pipx</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    pipx install {selectedRelease.wheelUrl}
                  </code>
                  <button
                    type="button"
                    class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    onclick={() => copyToClipboard(`pipx install ${selectedRelease.wheelUrl}`, 'pipx')}
                    title="Copy"
                  >
                    <Icon path={copied === 'pipx' ? mdiCheck : mdiContentCopy} size="18" />
                  </button>
                </div>
              </div>
              <div>
                <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Poetry</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    poetry add {selectedRelease.wheelUrl}
                  </code>
                  <button
                    type="button"
                    class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    onclick={() => copyToClipboard(`poetry add ${selectedRelease.wheelUrl}`, 'poetry')}
                    title="Copy"
                  >
                    <Icon path={copied === 'poetry' ? mdiCheck : mdiContentCopy} size="18" />
                  </button>
                </div>
              </div>
              <div>
                <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">uv</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    uv pip install {selectedRelease.wheelUrl}
                  </code>
                  <button
                    type="button"
                    class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    onclick={() => copyToClipboard(`uv pip install ${selectedRelease.wheelUrl}`, 'uv')}
                    title="Copy"
                  >
                    <Icon path={copied === 'uv' ? mdiCheck : mdiContentCopy} size="18" />
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <span class="text-zinc-500 dark:text-zinc-400 text-sm">No wheel in latest release.</span>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'termux'}
        <div id="termux" class="glass-card p-8">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon path={mdiAndroid} size="24" />
            Termux
          </h2>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">Install on Android via Termux. Install dependencies, then the Python wheel. Run headless with <code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">meshchat --headless</code>.</p>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-2">1. Update and install packages</p>
              <pre class="px-4 py-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-900 overflow-x-auto">pkg upgrade
pkg install python
pkg install rust
pkg install binutils
pkg install build-essential</pre>
            </div>
            <div>
              <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-2">2. Install MeshChatX (use latest version from releases)</p>
              <div class="flex items-center gap-2 flex-wrap">
                <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all">
                  pip install https://git.quad4.io/RNS-Things/MeshChatX/releases/download/v{selectedRelease.version || '4.1.0'}/reticulum_meshchatx-{selectedRelease.version || '4.1.0'}-py3-none-any.whl
                </code>
                <button
                  type="button"
                  class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  onclick={() => copyToClipboard(`pip install https://git.quad4.io/RNS-Things/MeshChatX/releases/download/v${selectedRelease.version || '4.1.0'}/reticulum_meshchatx-${selectedRelease.version || '4.1.0'}-py3-none-any.whl`, 'termux-pip')}
                  title="Copy"
                >
                  <Icon path={copied === 'termux-pip' ? mdiCheck : mdiContentCopy} size="18" />
                </button>
              </div>
            </div>
            <div>
              <p class="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-2">3. Run headless</p>
              <div class="flex items-center gap-2 flex-wrap">
                <code class="flex-1 min-w-0 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100">
                  meshchat --headless
                </code>
                <button
                  type="button"
                  class="shrink-0 p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  onclick={() => copyToClipboard('meshchat --headless', 'termux-run')}
                  title="Copy"
                >
                  <Icon path={copied === 'termux-run' ? mdiCheck : mdiContentCopy} size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
