<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { AppLocale } from "$lib/merge-messages";
  import {
    MESHCHATX_CLONE_URL,
    MESHCHATX_PKGBUILD,
    MESHCHATX_RELEASES,
  } from "$lib/meshchatx-repo";
  import { appPath } from "$lib/paths";

  const { locale: loc } = $props<{ locale: AppLocale }>();
  const COMPOSE_YAML = `services:
    reticulum-meshchatx:
        container_name: reticulum-meshchatx
        image: \${MESHCHAT_IMAGE:-quad4io/meshchatx:latest}
        restart: unless-stopped
        security_opt:
            - no-new-privileges:true
        ports:
            - 127.0.0.1:8000:8000
        volumes:
            - meshchatx-config:/config

volumes:
    meshchatx-config:
        name: meshchatx-config`;
</script>

<section class="mcx-page-head">
  <div class="mcx-container mcx-container--md">
    <h1>{$_('dl.h1')}</h1>
    <noscript>
      <div class="mcx-nojs-download-banner" role="status">
        <p class="mcx-nojs-download-banner__title">{$_('dl.nojs_banner_title')}</p>
        <p class="mcx-nojs-download-banner__text">{$_('dl.nojs_banner_text')}</p>
      </div>
    </noscript>
    <div class="mb-10 space-y-1" style="margin-bottom:2.5rem">
      <p class="mcx-muted" style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem" id="mcx-download-meta">
        <span class="mcx-js-only">{$_('dl.loading')}</span>
        <noscript>
          <span
            >{$_('dl.meta_noscript')}
            <a href={MESHCHATX_RELEASES} class="mcx-link-blue" target="_blank" rel="noopener noreferrer"
              >github.com/Quad4-Software/MeshChatX/releases</a
            ></span
          >
        </noscript>
      </p>
      <p class="mcx-muted mcx-text-sm" style="display:flex;flex-wrap:wrap;align-items:center;gap:0.375rem;margin-top:0.25rem">
        <a
          href={MESHCHATX_RELEASES}
          class="mcx-link-blue"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;gap:0.375rem;font-weight:600"
        >
          <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-github" /></svg>
          {$_('dl.github_releases')}
        </a>
      </p>
      <p id="mcx-sbom-wrap" class="mcx-text-sm hidden" style="margin-top:0.35rem">
        <a
          id="mcx-sbom-link"
          class="mcx-link-blue"
          style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          >{$_('dl.sbom')}</a
        >
      </p>
    </div>

    <div class="mcx-download-tabs">
      <a href={appPath(loc, "download", "macos")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-apple" /></svg> {$_('dl.tabs.macos')}</a>
      <a href={appPath(loc, "download", "linux")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-linux" /></svg> {$_('dl.tabs.linux')}</a>
      <a href={appPath(loc, "download", "windows")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-microsoft-windows" /></svg> {$_('dl.tabs.windows')}</a>
      <a href={appPath(loc, "download", "docker")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-docker" /></svg> {$_('dl.tabs.docker')}</a>
      <a href={appPath(loc, "download", "python")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-language-python" /></svg> {$_('dl.tabs.python')}</a>
      <a href={appPath(loc, "download", "android")}><svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-android" /></svg> {$_('dl.tabs.android')}</a>
    </div>

    <div class="mcx-download-sections">
      <section id="macos" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-apple" /></svg> {$_('dl.macos.h2')}
        </h2>
        <div id="mcx-macos-pending">
          <p class="mcx-muted" style="margin-bottom:1rem">{$_('dl.macos.note')}</p>
          <span class="mcx-badge-status">{$_('dl.macos.badge')}</span>
        </div>
        <div style="margin-bottom:1rem">
          <a id="mcx-dl-macos-dmg" class="mcx-btn-primary hidden" href="#" download
            ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.macos.btn_dmg')}</a
          >
        </div>
        <p class="mcx-muted mcx-text-sm">
          {$_('dl.macos.hint_before')}<a href={appPath(loc, "download", "python")} class="mcx-link-blue" style="font-weight:700">{$_('dl.macos.hint_python')}</a>{$_('dl.macos.hint_mid')}<a href={appPath(loc, "download", "docker")} class="mcx-link-blue" style="font-weight:700">{$_('dl.macos.hint_docker')}</a>{$_('dl.macos.hint_after')}
        </p>
      </section>

      <section id="linux" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
          {$_('dl.linux.h2')}
          <span style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);text-transform:uppercase;letter-spacing:0.1em;margin-left:auto"
            >{$_('dl.linux.arch_note')}</span
          >
        </h2>

        <details class="mcx-details" open>
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_('dl.linux.appimage')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.linux.appimage_intro')}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              <a id="mcx-dl-appimage-amd64" class="mcx-btn-primary hidden" href="#" download
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.linux.btn_appimage_amd64')}</a
              >
              <a
                id="mcx-dl-appimage-arm64"
                class="mcx-btn-secondary hidden"
                href="#"
                download
                style="border-radius:1rem"
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-cpu-64-bit" /></svg> {$_('dl.linux.btn_appimage_arm64')}</a
              >
            </div>
            <p id="mcx-no-appimage" class="mcx-muted mcx-text-sm hidden">{$_('dl.linux.no_appimage')}</p>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_('dl.linux.install_run')}</p>
              <pre class="mcx-pre">chmod +x MeshChatX-*.AppImage
./MeshChatX-*.AppImage</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-cube-outline" /></svg> {$_('dl.linux.deb')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.linux.deb_intro')}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              <a id="mcx-dl-deb-amd64" class="mcx-btn-primary hidden" href="#" download
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.linux.btn_deb_amd64')}</a
              >
              <a id="mcx-dl-deb-arm64" class="mcx-btn-secondary hidden" href="#" download
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-cpu-64-bit" /></svg> {$_('dl.linux.btn_deb_arm64')}</a
              >
            </div>
            <p id="mcx-no-deb" class="mcx-muted mcx-text-sm hidden">{$_('dl.linux.no_deb')}</p>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_('dl.linux.install')}</p>
              <pre class="mcx-pre">sudo apt install ./MeshChatX-*.deb
# fallback if apt cannot resolve dependencies:
sudo dpkg -i MeshChatX-*.deb
sudo apt -f install</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_('dl.linux.rpm')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.linux.rpm_intro')}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              <a id="mcx-dl-rpm-amd64" class="mcx-btn-primary hidden" href="#" download
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.linux.btn_rpm_amd64')}</a
              >
            </div>
            <p id="mcx-no-rpm" class="mcx-muted mcx-text-sm hidden">{$_('dl.linux.no_rpm')}</p>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_('dl.linux.install')}</p>
              <pre class="mcx-pre">sudo dnf install ./MeshChatX-*.rpm
# or on openSUSE:
sudo zypper install ./MeshChatX-*.rpm</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_('dl.linux.flatpak')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.linux.flatpak_intro')}</p>
            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
              <a id="mcx-dl-flatpak" class="mcx-btn-primary hidden" href="#" download
                ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.linux.btn_flatpak')}</a
              >
            </div>
            <p id="mcx-no-flatpak" class="mcx-muted mcx-text-sm hidden">{$_('dl.linux.no_flatpak')}</p>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 1rem">{$_('dl.linux.install')}</p>
              <pre class="mcx-pre">flatpak install --user ./MeshChatX-*.flatpak</pre>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-arch" /></svg> {$_('dl.linux.arch')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">
              {$_('dl.linux.arch_intro_before')}<code class="mcx-code-inline">pacman</code>{$_('dl.linux.arch_intro_after')}
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.linux.arch_step1')}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">git clone {MESHCHATX_CLONE_URL}
cd MeshChatX/packaging/arch</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.linux.arch_step2')}</p>
            <pre class="mcx-pre" style="margin-bottom:1rem">makepkg -si</pre>
            <a href={MESHCHATX_PKGBUILD} target="_blank" rel="noopener noreferrer" class="mcx-link-blue" style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">{$_('dl.linux.view_pkgbuild')}</a>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-source-commit" /></svg> {$_('dl.linux.source')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.linux.source_intro')}</p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.linux.source_step1')}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">git clone {MESHCHATX_CLONE_URL}
cd MeshChatX</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.linux.source_step2')}</p>
            <pre class="mcx-pre" style="margin-bottom:1.5rem">corepack enable
pnpm install
pnpm run build-frontend</pre>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.linux.source_step3')}</p>
            <pre class="mcx-pre">pip install poetry
poetry install
poetry run meshchat --headless --host 127.0.0.1</pre>
          </div>
        </details>
      </section>

      <section id="windows" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-microsoft-windows" /></svg> {$_('dl.windows.h2')}
          <span style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);text-transform:uppercase;letter-spacing:0.1em;margin-left:auto">{$_('dl.windows.badge_64')}</span>
        </h2>
        <p class="mcx-muted" style="margin-bottom:1.5rem">{$_('dl.windows.intro')}</p>
        <div style="display:flex;flex-wrap:wrap;gap:1rem">
          <a id="mcx-dl-win-inst" class="mcx-btn-primary hidden" href="#" download
            ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.windows.btn_installer')}</a
          >
          <a id="mcx-dl-win-port" class="mcx-btn-secondary hidden" href="#" download
            ><svg class="mcx-icon" aria-hidden="true"><use href="#i-package-variant" /></svg> {$_('dl.windows.btn_portable')}</a
          >
        </div>
        <p id="mcx-no-win" class="mcx-muted mcx-text-sm hidden" style="margin-top:1rem">{$_('dl.windows.no_win')}</p>
      </section>

      <section id="docker" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 1.5rem">{$_('dl.containers.h2')}</h2>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-script-text-outline" /></svg> {$_('dl.containers.compose')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem">{$_('dl.containers.compose_intro_before')}<code class="mcx-code-inline">{$_('dl.containers.compose_filename')}</code>{$_('dl.containers.compose_intro_after')}</p>
            <div class="mcx-pre-wrap">
              <pre class="mcx-pre" id="mcx-compose-yaml">{COMPOSE_YAML}</pre>
              <button type="button" class="mcx-copy-btn" style="top:0.75rem;right:0.75rem" id="mcx-compose-copy" title="{$_('dl.containers.copy_compose')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-docker" /></svg> {$_('dl.containers.docker')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
              {$_('dl.containers.run_docker')}
              <span class="mcx-badge-pill mcx-badge-pill--end">{$_('dl.containers.arch_badge')}</span>
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.containers.pull_image')}</p>
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">{$_('dl.containers.registries_note')}</p>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.containers.registry_label_dockerhub')}</p>
            <div class="mcx-code-row" style="margin-bottom:1rem">
              <code id="mcx-docker-pull-hub-text">docker pull quad4io/meshchatx:latest</code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" id="mcx-docker-pull-hub-copy" data-copy="docker pull quad4io/meshchatx:latest" title="{$_('dl.containers.copy_pull')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.containers.registry_label_ghcr')}</p>
            <div class="mcx-code-row" style="margin-bottom:1.5rem">
              <code id="mcx-docker-pull-ghcr-text">docker pull ghcr.io/quad4-software/meshchatx:latest</code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" id="mcx-docker-pull-ghcr-copy" data-copy="docker pull ghcr.io/quad4-software/meshchatx:latest" title="{$_('dl.containers.copy_pull')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.containers.run_cmd')}</p>
              <div class="mcx-pre-wrap">
                <pre class="mcx-pre" id="mcx-docker-run">docker run -d --name reticulum-meshchatx \
  --restart unless-stopped \
  --security-opt no-new-privileges:true \
  -p 127.0.0.1:8000:8000 \
  -v meshchatx-config:/config \
  quad4io/meshchatx:latest</pre>
                <button type="button" class="mcx-copy-btn" style="top:0.75rem;right:0.75rem" id="mcx-docker-run-copy" data-copy="" title="{$_('dl.containers.copy_run')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
            <p class="mcx-muted mcx-text-sm" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
              {$_('dl.containers.trivy_before')}<a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer" class="mcx-link-blue">{$_('dl.containers.trivy_link')}</a>.
            </p>
          </div>
        </details>

        <details class="mcx-details">
          <summary>
            <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-cube-outline" /></svg> {$_('dl.containers.podman')}
          </summary>
          <div class="mcx-details-body">
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
              {$_('dl.containers.run_podman')}
              <span class="mcx-badge-pill mcx-badge-pill--end">{$_('dl.containers.arch_badge')}</span>
            </p>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.containers.pull_image')}</p>
            <p class="mcx-muted mcx-text-sm" style="margin-bottom:1rem">{$_('dl.containers.registries_note')}</p>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.containers.registry_label_dockerhub')}</p>
            <div class="mcx-code-row" style="margin-bottom:1rem">
              <code id="mcx-podman-pull-hub-text">podman pull quad4io/meshchatx:latest</code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" id="mcx-podman-pull-hub-copy" data-copy="podman pull quad4io/meshchatx:latest" title="{$_('dl.containers.copy_pull')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--zinc-400);letter-spacing:0.05em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.containers.registry_label_ghcr')}</p>
            <div class="mcx-code-row" style="margin-bottom:1.5rem">
              <code id="mcx-podman-pull-ghcr-text">podman pull ghcr.io/quad4-software/meshchatx:latest</code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" id="mcx-podman-pull-ghcr-copy" data-copy="podman pull ghcr.io/quad4-software/meshchatx:latest" title="{$_('dl.containers.copy_pull')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
            <div style="border-top:1px solid var(--border);padding-top:1.5rem">
              <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.75rem">{$_('dl.containers.run_cmd')}</p>
              <div class="mcx-pre-wrap">
                <pre class="mcx-pre" id="mcx-podman-run">podman run -d --name reticulum-meshchatx \
  --restart unless-stopped \
  --security-opt no-new-privileges:true \
  -p 127.0.0.1:8000:8000 \
  -v meshchatx-config:/config \
  quad4io/meshchatx:latest</pre>
                <button type="button" class="mcx-copy-btn" style="top:0.75rem;right:0.75rem" id="mcx-podman-run-copy" data-copy="" title="{$_('dl.containers.copy_run')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
            <p class="mcx-muted mcx-text-sm" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
              {$_('dl.containers.trivy_before')}<a href="https://trivy.dev/" target="_blank" rel="noopener noreferrer" class="mcx-link-blue">{$_('dl.containers.trivy_link')}</a>.
            </p>
          </div>
        </details>
      </section>

      <section id="python" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-language-python" /></svg> {$_('dl.python.h2')}
        </h2>
        <p class="mcx-muted" style="margin-bottom:1rem">{$_('dl.python.intro')}</p>
        <div id="mcx-python-block">
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_('dl.python.pip')}</p>
              <div class="mcx-code-row">
                <code data-wheel-cmd="pip">pip install </code>
                <button type="button" class="mcx-copy-btn" style="position:static;transform:none" data-copy="" title="{$_('dl.python.copy')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_('dl.python.pipx')}</p>
              <div class="mcx-code-row">
                <code data-wheel-cmd="pipx">pipx install </code>
                <button type="button" class="mcx-copy-btn" style="position:static;transform:none" data-copy="" title="{$_('dl.python.copy')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_('dl.python.poetry')}</p>
              <div class="mcx-code-row">
                <code data-wheel-cmd="poetry">poetry add </code>
                <button type="button" class="mcx-copy-btn" style="position:static;transform:none" data-copy="" title="{$_('dl.python.copy')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
            <div>
              <p style="font-weight:700;margin:0 0 0.25rem;color:var(--text-muted)">{$_('dl.python.uv')}</p>
              <div class="mcx-code-row">
                <code data-wheel-cmd="uv">uv pip install </code>
                <button type="button" class="mcx-copy-btn" style="position:static;transform:none" data-copy="" title="{$_('dl.python.copy')}">
                  <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p id="mcx-python-empty" class="mcx-muted mcx-text-sm hidden">{$_('dl.python.no_wheel')}</p>
      </section>

      <section id="android" class="mcx-download-section">
        <h2 style="font-size:1.25rem;font-weight:900;margin:0 0 0.5rem;display:flex;align-items:center;gap:0.5rem">
          <svg class="mcx-icon" aria-hidden="true"><use href="#i-android" /></svg> {$_('dl.android.h2')}
        </h2>
        <h3 style="font-size:1rem;font-weight:800;margin:1.25rem 0 0.5rem">{$_('dl.android.apk_h3')}</h3>
        <div id="mcx-android-apk-pending">
          <p class="mcx-muted" style="margin-bottom:1rem">{$_('dl.android.intro')}</p>
          <span class="mcx-badge-status">{$_('dl.android.badge')}</span>
        </div>
        <div style="margin-bottom:1rem">
          <a id="mcx-dl-apk" class="mcx-btn-primary hidden" href="#" download
            ><svg class="mcx-icon" aria-hidden="true"><use href="#i-download" /></svg> {$_('dl.android.btn_apk')}</a
          >
        </div>
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
              alt={$_('dl.android.obtainium_alt')}
            />
          </a>
        </div>
        <h3 style="font-size:1rem;font-weight:800;margin:1.75rem 0 0.5rem">{$_('dl.android.termux_h3')}</h3>
        <p class="mcx-muted" style="margin-bottom:1.5rem">
          {$_('dl.termux.intro_before')}<code class="mcx-code-inline">meshchat --headless</code>{$_('dl.termux.intro_after')}
        </p>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.termux.step1')}</p>
            <pre class="mcx-pre">pkg upgrade
pkg install python
pkg install rust
pkg install binutils
pkg install build-essential</pre>
          </div>
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.termux.step2')}</p>
            <div class="mcx-code-row">
              <code id="mcx-termux-pip" style="font-size:0.75rem">pip install </code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" id="mcx-termux-pip-copy" data-copy="" title="{$_('dl.python.copy')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
          </div>
          <div>
            <p style="font-size:0.875rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 0.5rem">{$_('dl.termux.step3')}</p>
            <div class="mcx-code-row">
              <code>meshchat --headless</code>
              <button type="button" class="mcx-copy-btn" style="position:static;transform:none" data-copy="meshchat --headless" title="{$_('dl.python.copy')}">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <p class="mcx-muted mcx-text-sm" style="margin-top:2rem">{$_('dl.cdn_attrib')}</p>
  </div>
</section>
