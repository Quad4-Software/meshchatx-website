<script lang="ts">
  import { page } from "$app/state";
  import { _ } from "svelte-i18n";
  import CopyButton from "$lib/CopyButton.svelte";
  import DownloadMeta from "$lib/DownloadMeta.svelte";
  import { useDownloadReleases } from "$lib/download-remote-releases.svelte";
  import {
    COMPOSE_YAML,
    containerPullCmd,
    containerRunCmd,
  } from "$lib/docker-commands";
  import {
    channelFromSearch,
    linuxOrPre,
    selectDownloadRelease,
    TERMUX_PIP_CMD,
    wheelInstallCmd,
    type WheelCmdKind,
  } from "$lib/download-page";
  import type { McxReleasesPayload } from "$lib/github-releases.server";
  import type { AppLocale } from "$lib/merge-messages";
  import {
    MESHCHATX_CLONE_URL,
    MESHCHATX_PKGBUILD,
    MESHCHATX_PYPI,
    MESHCHATX_PYPI_PACKAGE,
    MESHCHATX_RELEASES,
    MESHCHATX_RELEASES_ATOM,
    MESHCHATX_UMBREL,
  } from "$lib/meshchatx-repo";
  import { appPath } from "$lib/paths";

  let { locale: loc, releases: serverReleases } = $props<{
    locale: AppLocale;
    releases: McxReleasesPayload;
  }>();

  const downloadReleases = useDownloadReleases(() => serverReleases);
  const releases = $derived(downloadReleases.releases);

  const channel = $derived(channelFromSearch(page.url.search));
  const selection = $derived(selectDownloadRelease(releases, channel));
  const selectedRelease = $derived(selection.release);
  const preRelease = $derived(releases.prerelease);

  const appAmd = $derived(linuxOrPre(selectedRelease, preRelease, "appImageAmd64Url"));
  const appArm = $derived(linuxOrPre(selectedRelease, preRelease, "appImageArm64Url"));
  const debA = $derived(linuxOrPre(selectedRelease, preRelease, "debAmd64Url"));
  const debR = $derived(linuxOrPre(selectedRelease, preRelease, "debArm64Url"));
  const rpmA = $derived(linuxOrPre(selectedRelease, preRelease, "rpmAmd64Url"));
  const flat = $derived(linuxOrPre(selectedRelease, preRelease, "flatpakUrl"));
  const macDmgUrl = $derived(
    selectedRelease?.macDmgUrl ?? preRelease?.macDmgUrl ?? null,
  );
  const wheelUrl = $derived(selectedRelease?.wheelUrl ?? null);

  const dockerPullHub = $derived(containerPullCmd("docker", "hub"));
  const dockerPullGhcr = $derived(containerPullCmd("docker", "ghcr"));
  const podmanPullHub = $derived(containerPullCmd("podman", "hub"));
  const podmanPullGhcr = $derived(containerPullCmd("podman", "ghcr"));
  const dockerRun = $derived(containerRunCmd("docker"));
  const podmanRun = $derived(containerRunCmd("podman"));

  const PYPI_PIP = `pip install ${MESHCHATX_PYPI_PACKAGE}`;
  const PYPI_PIPX = `pipx install ${MESHCHATX_PYPI_PACKAGE}`;
  const PYPI_POETRY = `poetry add ${MESHCHATX_PYPI_PACKAGE}`;
  const PYPI_UV = `uv pip install ${MESHCHATX_PYPI_PACKAGE}`;
  const PYPI_UVX = `uvx --from ${MESHCHATX_PYPI_PACKAGE} meshchatx`;

  const wheelCmds = $derived(
    wheelUrl
      ? ({
          pip: wheelInstallCmd("pip", wheelUrl),
          pipx: wheelInstallCmd("pipx", wheelUrl),
          poetry: wheelInstallCmd("poetry", wheelUrl),
          uv: wheelInstallCmd("uv", wheelUrl),
        } satisfies Record<WheelCmdKind, string>)
      : null,
  );
</script>

<section class="mcx-page-head">
  <div class="mcx-container mcx-container--md">
    <h1>{$_("dl.h1")}</h1>
    <noscript>
      <div class="mcx-nojs-download-banner" role="status">
        <p class="mcx-nojs-download-banner__title">{$_("dl.nojs_banner_title")}</p>
        <p class="mcx-nojs-download-banner__text">{$_("dl.nojs_banner_text")}</p>
      </div>
    </noscript>
    <div class="mb-10 space-y-1" style="margin-bottom:2.5rem">
      <DownloadMeta {releases} locale={loc} />
      <p class="mcx-muted mcx-text-sm mcx-download-meta-row">
        <span>{$_("dl.github_also")}</span>
        <a
          href={MESHCHATX_RELEASES}
          class="mcx-link-blue mcx-download-github-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-github" /></svg>
          {$_("dl.github_releases")}
        </a>
        <span class="mcx-download-meta-sep" aria-hidden="true">·</span>
        <a
          href={MESHCHATX_RELEASES_ATOM}
          class="mcx-link-blue mcx-download-github-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-rss" /></svg>
          {$_("dl.releases_atom")}
        </a>
      </p>
    </div>

    <div class="mcx-download-tabs">
      <a href={appPath(loc, "download", "macos")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-apple" /></svg> {$_("dl.tabs.macos")}</a>
      <a href={appPath(loc, "download", "linux")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-linux" /></svg> {$_("dl.tabs.linux")}</a>
      <a href={appPath(loc, "download", "windows")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-microsoft-windows" /></svg> {$_("dl.tabs.windows")}</a>
      <a href={appPath(loc, "download", "docker")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-docker" /></svg> {$_("dl.tabs.docker")}</a>
      <a href={appPath(loc, "download", "python")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-language-python" /></svg> {$_("dl.tabs.python")}</a>
      <a href={appPath(loc, "download", "android")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-android" /></svg> {$_("dl.tabs.android")}</a>
      <a href={appPath(loc, "download", "umbrel")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-home" /></svg> {$_("dl.tabs.umbrel")}</a>
    </div>

    <div class="mcx-download-sections">
      <section id="macos" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-apple" /></svg> {$_("dl.macos.h2")}
        </h2>
        {#if !macDmgUrl}
          <div id="mcx-macos-pending">
            <p class="mcx-muted" style="margin-bottom:1rem">{$_("dl.macos.note")}</p>
            <span class="mcx-badge-status">{$_("dl.macos.badge")}</span>
          </div>
        {/if}
        {#if macDmgUrl}
          <div style="margin-bottom:1rem">
            <a class="mcx-btn-primary" href={macDmgUrl} download
              ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.macos.btn_dmg")}</a
            >
          </div>
        {/if}
        <p class="mcx-muted mcx-text-sm">
          {$_("dl.macos.hint_before")}<a href={appPath(loc, "download", "python")} class="mcx-link-blue" style="font-weight:700">{$_("dl.macos.hint_python")}</a>{$_("dl.macos.hint_mid")}<a href={appPath(loc, "download", "docker")} class="mcx-link-blue" style="font-weight:700">{$_("dl.macos.hint_docker")}</a>{$_("dl.macos.hint_after")}
        </p>
      </section>

      <section id="linux" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
          {$_("dl.linux.h2")}
          <span style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);text-transform:uppercase;letter-spacing:0.1em;margin-left:auto"
            >{$_("dl.linux.arch_note")}</span
          >
        </h2>

        <details class="mcx-details" open>
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_("dl.linux.appimage")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.linux.appimage_intro")}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              {#if appAmd}
                <a class="mcx-btn-primary" href={appAmd} download
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.linux.btn_appimage_amd64")}</a
                >
              {/if}
              {#if appArm}
                <a class="mcx-btn-secondary" href={appArm} download style="border-radius:1rem"
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-cpu-64-bit" /></svg> {$_("dl.linux.btn_appimage_arm64")}</a
                >
              {/if}
            </div>
            {#if !appAmd && !appArm}
              <p class="mcx-muted mcx-text-sm">{$_("dl.linux.no_appimage")}</p>
            {/if}
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_("dl.linux.install_run")}</p>
              <pre class="mcx-pre">chmod +x MeshChatX-*.AppImage
./MeshChatX-*.AppImage</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-cube-outline" /></svg> {$_("dl.linux.deb")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.linux.deb_intro")}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              {#if debA}
                <a class="mcx-btn-primary" href={debA} download
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.linux.btn_deb_amd64")}</a
                >
              {/if}
              {#if debR}
                <a class="mcx-btn-secondary" href={debR} download
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-cpu-64-bit" /></svg> {$_("dl.linux.btn_deb_arm64")}</a
                >
              {/if}
            </div>
            {#if !debA && !debR}
              <p class="mcx-muted mcx-text-sm">{$_("dl.linux.no_deb")}</p>
            {/if}
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_("dl.linux.install")}</p>
              <pre class="mcx-pre">sudo apt install ./MeshChatX-*.deb
# fallback if apt cannot resolve dependencies:
sudo dpkg -i MeshChatX-*.deb
sudo apt -f install</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_("dl.linux.rpm")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.linux.rpm_intro")}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              {#if rpmA}
                <a class="mcx-btn-primary" href={rpmA} download
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.linux.btn_rpm_amd64")}</a
                >
              {/if}
            </div>
            {#if !rpmA}
              <p class="mcx-muted mcx-text-sm">{$_("dl.linux.no_rpm")}</p>
            {/if}
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_("dl.linux.install")}</p>
              <pre class="mcx-pre">sudo dnf install ./MeshChatX-*.rpm
# or on openSUSE:
sudo zypper install ./MeshChatX-*.rpm</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_("dl.linux.flatpak")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.linux.flatpak_intro")}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              {#if flat}
                <a class="mcx-btn-primary" href={flat} download
                  ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.linux.btn_flatpak")}</a
                >
              {/if}
            </div>
            {#if !flat}
              <p class="mcx-muted mcx-text-sm">{$_("dl.linux.no_flatpak")}</p>
            {/if}
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_("dl.linux.install")}</p>
              <pre class="mcx-pre">flatpak install ./MeshChatX-*.flatpak</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-arch" /></svg> {$_("dl.linux.arch")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">
              {$_("dl.linux.arch_intro_before")}<code class="mcx-code-inline">pacman</code>{$_("dl.linux.arch_intro_after")}
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.linux.arch_step1")}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">git clone {MESHCHATX_CLONE_URL}
cd MeshChatX/packaging/arch</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.linux.arch_step2")}</p>
            <pre class="mcx-pre" style="margin-bottom:1rem">makepkg -si</pre>
            <a href={MESHCHATX_PKGBUILD} target="_blank" rel="noopener noreferrer" class="mcx-link-blue" style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">{$_("dl.linux.view_pkgbuild")}</a>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-source-commit" /></svg> {$_("dl.linux.source")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.linux.source_intro")}</p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.linux.source_step1")}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">git clone {MESHCHATX_CLONE_URL}
cd MeshChatX</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.linux.source_step2")}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">corepack enable
pnpm install
pnpm run build-frontend</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.linux.source_step3")}</p>
            <pre class="mcx-pre">pip install poetry
poetry install
poetry run meshchat --headless --host 127.0.0.1</pre>
          </div>
        </details>
      </section>

      <section id="windows" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-microsoft-windows" /></svg> {$_("dl.windows.h2")}
          <span style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);text-transform:uppercase;letter-spacing:0.1em;margin-left:auto">{$_("dl.windows.badge_64")}</span>
        </h2>
        <p class="mcx-muted" style="margin-bottom:1.5rem">{$_("dl.windows.intro")}</p>
        <div style="display:flex;flex-wrap:wrap;gap:1rem">
          {#if selectedRelease?.winInstallerUrl}
            <a class="mcx-btn-primary" href={selectedRelease.winInstallerUrl} download
              ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.windows.btn_installer")}</a
            >
          {/if}
          {#if selectedRelease?.winPortableUrl}
            <a class="mcx-btn-secondary" href={selectedRelease.winPortableUrl} download
              ><svg class="mcx-icon" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_("dl.windows.btn_portable")}</a
            >
          {/if}
        </div>
        {#if !selectedRelease?.winInstallerUrl && !selectedRelease?.winPortableUrl}
          <p class="mcx-muted mcx-text-sm" style="margin-top:1rem">{$_("dl.windows.no_win")}</p>
        {/if}
      </section>

      <section id="docker" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 1.5rem">{$_("dl.containers.h2")}</h2>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-script-text-outline" /></svg> {$_("dl.containers.compose")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_("dl.containers.compose_intro_before")}<code class="mcx-code-inline">{$_("dl.containers.compose_filename")}</code>{$_("dl.containers.compose_intro_after")}</p>
            <div class="mcx-pre-wrap">
              <pre class="mcx-pre">{COMPOSE_YAML}</pre>
              <CopyButton text={COMPOSE_YAML} title={$_("dl.containers.copy_compose")} style="top:0.75rem;right:0.75rem" />
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-docker" /></svg> {$_("dl.containers.docker")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
              {$_("dl.containers.run_docker")}
              <span class="mcx-badge-pill mcx-badge-pill--end">{$_("dl.containers.arch_badge")}</span>
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.containers.pull_image")}</p>
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">{$_("dl.containers.registries_note")}</p>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.containers.registry_label_dockerhub")}</p>
            <div class="mcx-code-row" style="margin-bottom:1rem">
              <code>{dockerPullHub}</code>
              <CopyButton text={dockerPullHub} title={$_("dl.containers.copy_pull")} style="position:static;transform:none" />
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.containers.registry_label_ghcr")}</p>
            <div class="mcx-code-row" style="margin-bottom:1.5rem">
              <code>{dockerPullGhcr}</code>
              <CopyButton text={dockerPullGhcr} title={$_("dl.containers.copy_pull")} style="position:static;transform:none" />
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.containers.run_cmd")}</p>
              <div class="mcx-pre-wrap">
                <pre class="mcx-pre">{dockerRun}</pre>
                <CopyButton text={dockerRun} title={$_("dl.containers.copy_run")} style="top:0.75rem;right:0.75rem" />
              </div>
            </div>
            <p class="mcx-muted mcx-text-sm" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
              {$_("dl.containers.trivy_before")}<a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer" class="mcx-link-blue">{$_("dl.containers.trivy_link")}</a>.
            </p>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-cube-outline" /></svg> {$_("dl.containers.podman")}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
              {$_("dl.containers.run_podman")}
              <span class="mcx-badge-pill mcx-badge-pill--end">{$_("dl.containers.arch_badge")}</span>
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.containers.pull_image")}</p>
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">{$_("dl.containers.registries_note")}</p>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.containers.registry_label_dockerhub")}</p>
            <div class="mcx-code-row" style="margin-bottom:1rem">
              <code>{podmanPullHub}</code>
              <CopyButton text={podmanPullHub} title={$_("dl.containers.copy_pull")} style="position:static;transform:none" />
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.containers.registry_label_ghcr")}</p>
            <div class="mcx-code-row" style="margin-bottom:1.5rem">
              <code>{podmanPullGhcr}</code>
              <CopyButton text={podmanPullGhcr} title={$_("dl.containers.copy_pull")} style="position:static;transform:none" />
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_("dl.containers.run_cmd")}</p>
              <div class="mcx-pre-wrap">
                <pre class="mcx-pre">{podmanRun}</pre>
                <CopyButton text={podmanRun} title={$_("dl.containers.copy_run")} style="top:0.75rem;right:0.75rem" />
              </div>
            </div>
            <p class="mcx-muted mcx-text-sm" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
              {$_("dl.containers.trivy_before")}<a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer" class="mcx-link-blue">{$_("dl.containers.trivy_link")}</a>.
            </p>
          </div>
        </details>
      </section>

      <section id="python" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-language-python" /></svg> {$_("dl.python.h2")}
        </h2>
        <p class="mcx-muted" style="margin-bottom:0.75rem">{$_("dl.python.intro")}</p>
        <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">
          <a
            href={MESHCHATX_PYPI}
            class="mcx-link-blue"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={$_("dl.python.pypi_link_aria")}>{$_("dl.python.pypi_link_text")}</a>
        </p>
        <div id="mcx-python-block">
          <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_("dl.python.pypi_heading")}</p>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_("dl.python.pip")}</p>
              <div class="mcx-code-row">
                <code>{PYPI_PIP}</code>
                <CopyButton text={PYPI_PIP} title={$_("dl.python.copy")} style="position:static;transform:none" />
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_("dl.python.pipx")}</p>
              <div class="mcx-code-row">
                <code>{PYPI_PIPX}</code>
                <CopyButton text={PYPI_PIPX} title={$_("dl.python.copy")} style="position:static;transform:none" />
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_("dl.python.poetry")}</p>
              <div class="mcx-code-row">
                <code>{PYPI_POETRY}</code>
                <CopyButton text={PYPI_POETRY} title={$_("dl.python.copy")} style="position:static;transform:none" />
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_("dl.python.uv")}</p>
              <div class="mcx-code-row">
                <code>{PYPI_UV}</code>
                <CopyButton text={PYPI_UV} title={$_("dl.python.copy")} style="position:static;transform:none" />
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_("dl.python.uvx")}</p>
              <p class="mcx-muted mcx-text-sm" style="margin:0 0 0.5rem">{$_("dl.python.uvx_hint")}</p>
              <div class="mcx-code-row">
                <code>{PYPI_UVX}</code>
                <CopyButton text={PYPI_UVX} title={$_("dl.python.copy")} style="position:static;transform:none" />
              </div>
            </div>
          </div>

          {#if wheelCmds}
            <div style="margin-top:1.75rem;padding-top:1.75rem;border-top:1px solid var(--border)">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.python.wheel_heading")}</p>
              <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">{$_("dl.python.wheel_intro")}</p>
              <div style="display:flex;flex-direction:column;gap:1rem">
                {#each ["pip", "pipx", "poetry", "uv"] as kind (kind)}
                  {@const cmd = wheelCmds[kind as WheelCmdKind]}
                  {@const labelKey = kind === "uv" ? "dl.python.uv" : `dl.python.${kind}`}
                  <div>
                    <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_(labelKey)}</p>
                    <div class="mcx-code-row">
                      <code>{cmd}</code>
                      <CopyButton text={cmd} title={$_("dl.python.copy")} style="position:static;transform:none" />
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </section>

      <section id="umbrel" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-home" /></svg>
          {$_("dl.umbrel.h2")}
        </h2>
        <p class="mcx-muted" style="margin-bottom:1.5rem">{$_("dl.umbrel.intro")}</p>
        <a
          class="mcx-btn-primary"
          href={MESHCHATX_UMBREL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-home" /></svg>
          {$_("dl.umbrel.btn")}
        </a>
      </section>

      <section id="android" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-android" /></svg> {$_("dl.android.h2")}
        </h2>
        <h3 style="font-size:1rem;font-weight:800;margin:1.25rem 0 0.5rem">{$_("dl.android.apk_h3")}</h3>
        {#if !selectedRelease?.apkUrl}
          <div id="mcx-android-apk-pending">
            <p class="mcx-muted" style="margin-bottom:1rem">{$_("dl.android.intro")}</p>
            <span class="mcx-badge-status">{$_("dl.android.badge")}</span>
          </div>
        {/if}
        {#if selectedRelease?.apkUrl}
          <div style="margin-bottom:1rem">
            <a class="mcx-btn-primary" href={selectedRelease.apkUrl} download
              ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_("dl.android.btn_apk")}</a
            >
          </div>
        {/if}
        <div style="margin-bottom:1rem">
          <a
            href="https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/Quad4-Software/MeshChatX"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/vendor/obtainium-badge.png"
              height="60"
              width="200"
              alt={$_("dl.android.obtainium_alt")}
            />
          </a>
        </div>
        <h3 style="font-size:1rem;font-weight:800;margin:1.75rem 0 0.5rem">{$_("dl.android.termux_h3")}</h3>
        <p class="mcx-muted" style="margin-bottom:1.5rem">
          {$_("dl.termux.intro_before")}<code class="mcx-code-inline">meshchat --headless</code>{$_("dl.termux.intro_after")}
        </p>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.termux.step1")}</p>
            <pre class="mcx-pre">pkg upgrade
pkg install python
pkg install rust
pkg install binutils
pkg install build-essential</pre>
          </div>
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.termux.step2")}</p>
            <div class="mcx-code-row">
              <code style="font-size:0.75rem">{TERMUX_PIP_CMD}</code>
              <CopyButton text={TERMUX_PIP_CMD} title={$_("dl.python.copy")} style="position:static;transform:none" />
            </div>
          </div>
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_("dl.termux.step3")}</p>
            <div class="mcx-code-row">
              <code>meshchat --headless</code>
              <CopyButton text="meshchat --headless" title={$_("dl.python.copy")} style="position:static;transform:none" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</section>
