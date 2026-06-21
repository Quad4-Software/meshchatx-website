<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { AppLocale } from "$lib/merge-messages";
  import type { McxReleasesPayload } from "$lib/github-releases.server";
  import { MESHCHATX_GITHUB } from "$lib/meshchatx-repo";
  import { appPath } from "$lib/paths";
  import Showcase from "$lib/Showcase.svelte";
  import VersionBadge from "$lib/VersionBadge.svelte";

  const { locale: loc, releases } = $props<{
    locale: AppLocale;
    releases: McxReleasesPayload;
  }>();
</script>

    <section class="mcx-hero">
      <div class="mcx-hero-inner mcx-container">
        <VersionBadge {releases} />
        <h1>{$_('home.hero.h1')}</h1>
        <p class="mcx-hero-lead">
          {$_('home.hero.lead')}
        </p>
        <div class="mcx-platform-row">
          <a data-plat="macos" href={appPath(loc, "download", "macos")} title="{$_('home.platform.macos')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-apple" /></svg>
            <span>{$_('home.platform.macos')}</span>
          </a>
          <a data-plat="linux" href={appPath(loc, "download", "linux")} title="{$_('home.platform.linux')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-linux" /></svg>
            <span>{$_('home.platform.linux')}</span>
          </a>
          <a data-plat="windows" href={appPath(loc, "download", "windows")} title="{$_('home.platform.windows')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-microsoft-windows" /></svg>
            <span>{$_('home.platform.windows')}</span>
          </a>
          <a data-plat="docker" href={appPath(loc, "download", "docker")} title="{$_('home.platform.docker')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-docker" /></svg>
            <span>{$_('home.platform.docker')}</span>
          </a>
          <a data-plat="python" href={appPath(loc, "download", "python")} title="{$_('home.platform.python')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-language-python" /></svg>
            <span>{$_('home.platform.python')}</span>
          </a>
          <a data-plat="android" href={appPath(loc, "download", "android")} title="{$_('home.platform.android')}">
            <svg class="mcx-icon mcx-icon--xl" aria-hidden="true"><use href="#i-android" /></svg>
            <span>{$_('home.platform.android')}</span>
          </a>
        </div>

        <Showcase desktopOnly />

        <div class="mcx-cap-grid">
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-message-text-outline" /></svg></div><span>{$_('home.cap.messaging')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-phone" /></svg></div><span>{$_('home.cap.calls')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-web" /></svg></div><span>{$_('home.cap.browser')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-folder-sync" /></svg></div><span>{$_('home.cap.file_transfer')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-robot" /></svg></div><span>{$_('home.cap.bots')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-pencil" /></svg></div><span>{$_('home.cap.micron')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-archive" /></svg></div><span>{$_('home.cap.archiver')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-map" /></svg></div><span>{$_('home.cap.mapping')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-magnify" /></svg></div><span>{$_('home.cap.discovery')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-account-multiple" /></svg></div><span>{$_('home.cap.identities')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-account-cancel" /></svg></div><span>{$_('home.cap.banishment')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-backup-restore" /></svg></div><span>{$_('home.cap.backups')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-cog" /></svg></div><span>{$_('home.cap.customizable')}</span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-chart-line" /></svg></div><span>{$_('home.cap.telemetry')}</span></div>
          <div class="mcx-cap-item mcx-soon"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-tunnel" /></svg></div><span>{$_('home.cap.tunnel')}<span class="mcx-cap-soon-note">{$_('home.cap.soon')}</span></span></div>
          <div class="mcx-cap-item"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-file-document" /></svg></div><span>{$_('home.cap.host_pages')}</span></div>
          <div class="mcx-cap-item mcx-soon"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-message-bulleted" /></svg></div><span>{$_('home.cap.group_msgs')}<span class="mcx-cap-soon-note">{$_('home.cap.soon')}</span></span></div>
          <div class="mcx-cap-item mcx-soon"><div class="mcx-cap-icon"><svg class="mcx-icon mcx-icon--xs" aria-hidden="true"><use href="#i-account-group" /></svg></div><span>{$_('home.cap.group_calls')}<span class="mcx-cap-soon-note">{$_('home.cap.soon')}</span></span></div>
        </div>
        <p class="mcx-more">{$_('home.cap.more')}</p>
        <div class="mcx-hero-cta">
          <a class="mcx-btn-primary" href={appPath(loc, "download")}>{$_('home.cta.download')}</a>
          <a class="mcx-btn-ghost" href={MESHCHATX_GITHUB} target="_blank" rel="noopener noreferrer"
            >{$_('home.cta.source')}</a
          >
        </div>
      </div>
    </section>

    <section id="features" class="mcx-section mcx-section--alt">
      <div class="mcx-container">
        <div class="mcx-section-head">
          <h2>{$_('home.section.infra_h2')}</h2>
          <p>{$_('home.section.infra_lead')}</p>
        </div>
        <div class="mcx-feature-grid">
          <div class="mcx-feature-card mcx-glass-card">
            <div class="mcx-feature-icon mcx-bg-blue"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-orbit" /></svg></div>
            <h3>{$_('home.feature.decentralized_h3')}</h3>
            <p>{$_('home.feature.decentralized_p')}</p>
          </div>
          <div class="mcx-feature-card mcx-glass-card">
            <div class="mcx-feature-icon mcx-bg-emerald"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-shield-lock-outline" /></svg></div>
            <h3>{$_('home.feature.crypto_h3')}</h3>
            <p>{$_('home.feature.crypto_p')}</p>
            <a href="https://reticulum.network/crypto.html" target="_blank" rel="noopener noreferrer">{$_('home.feature.crypto_link')}</a>
          </div>
          <div class="mcx-feature-card mcx-glass-card">
            <div class="mcx-feature-icon mcx-bg-amber"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-web" /></svg></div>
            <h3>{$_('home.feature.mesh_h3')}</h3>
            <p>{$_('home.feature.mesh_p')}</p>
          </div>
          <div class="mcx-feature-card mcx-glass-card">
            <div class="mcx-feature-icon mcx-bg-purple"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-monitor" /></svg></div>
            <h3>{$_('home.feature.platform_h3')}</h3>
            <p>{$_('home.feature.platform_p')}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="videos" class="mcx-section">
      <div class="mcx-container">
        <div class="mcx-section-head">
          <h2>{$_('home.videos.h2')}</h2>
          <p>{$_('home.videos.lead')}</p>
        </div>
        <div class="mcx-video-grid">
          <div class="mcx-video-embed mcx-glass-card">
            <iframe
              src="https://www.youtube.com/embed/defFiXuuxKg?si=-QXEjDkjTT2_-FBu"
              title={$_('home.videos.youtube_title')}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
          <div class="mcx-video-embed mcx-glass-card">
            <iframe
              src="https://www.youtube.com/embed/no7bahDoIUs"
              title={$_('home.videos.youtube_title_2')}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
    </section>

    <section class="mcx-section">
      <div class="mcx-container mcx-split mcx-split--single">
        <div>
          <h2>{$_('home.split.h2_line1')}<br />{$_('home.split.h2_line2')}</h2>
          <div class="mcx-split-list">
            <div class="mcx-split-item">
              <div class="mcx-split-icon"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-security" /></svg></div>
              <div>
                <h4>{$_('home.split.item1_h4')}</h4>
                <p>{$_('home.split.item1_p')}</p>
              </div>
            </div>
            <div class="mcx-split-item">
              <div class="mcx-split-icon"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-orbit" /></svg></div>
              <div>
                <h4>{$_('home.split.item2_h4')}</h4>
                <p>{$_('home.split.item2_p')}</p>
              </div>
            </div>
            <div class="mcx-split-item">
              <div class="mcx-split-icon"><svg class="mcx-icon mcx-icon--lg" aria-hidden="true"><use href="#i-archive" /></svg></div>
              <div>
                <h4>{$_('home.split.item3_h4')}</h4>
                <p>{$_('home.split.item3_p')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="security" class="mcx-section mcx-section--alt">
      <div class="mcx-container">
        <div class="mcx-section-head mcx-section-head--compact">
          <h2>{$_('home.security.h2')}</h2>
          <p>{$_('home.security.lead')}</p>
        </div>
        <div class="mcx-security-panel mcx-glass-card">
          <ul class="mcx-security-list">
            <li>{@html $_('home.security.bullet_slsa')}</li>
            <li>{@html $_('home.security.bullet_asar')}</li>
            <li>{@html $_('home.security.bullet_landlock')}</li>
            <li>{@html $_('home.security.bullet_sigstore')}</li>
            <li>{$_('home.security.bullet_sast')}</li>
            <li>{@html $_('home.security.bullet_csp')}</li>
            <li>{@html $_('home.security.bullet_transport')}</li>
          </ul>
        </div>
      </div>
    </section>
