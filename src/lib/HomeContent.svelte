<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { AppLocale } from "$lib/merge-messages";
  import { MESHCHATX_CHANGELOG, MESHCHATX_GITHUB } from "$lib/meshchatx-repo";
  import { appPath } from "$lib/paths";

  const { locale: loc } = $props<{ locale: AppLocale }>();
</script>

    <section class="mcx-hero">
      <div class="mcx-hero-orbs" aria-hidden="true">
        <div class="mcx-hero-orb mcx-hero-orb--a"></div>
        <div class="mcx-hero-orb mcx-hero-orb--b"></div>
      </div>
      <div class="mcx-hero-inner mcx-container">
        <a
          class="mcx-version-pill mcx-badge-enter hidden"
          data-version-badge
          href={MESHCHATX_CHANGELOG}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="mcx-pulse" aria-hidden="true"></span>
          <span data-version-text>MeshChatX</span>
        </a>
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

        <div id="showcase" class="mcx-showcase-wrap" data-mcx-showcase data-showcase-assets="/showcase/" data-showcase-desktop-only="true">
          <div class="mcx-toggle-pair hidden" aria-hidden="true">
            <button type="button" class="mcx-toggle is-active" data-view="mobile" title="{$_('home.showcase.mobile')}" aria-label="{$_('home.showcase.mobile')}" tabindex="-1">
              <svg class="mcx-icon mcx-icon--md" aria-hidden="true"><use href="#i-cellphone" /></svg>
            </button>
            <button type="button" class="mcx-toggle" data-view="desktop" title="{$_('home.showcase.desktop')}" aria-label="{$_('home.showcase.desktop')}" tabindex="-1">
              <svg class="mcx-icon mcx-icon--md" aria-hidden="true"><use href="#i-monitor" /></svg>
            </button>
          </div>

          <div data-showcase-mobile class="hidden">
            <div class="mcx-flex-center">
              <div class="mcx-showcase-phone">
                <div class="mcx-phone-notch"><span></span></div>
                <div class="mcx-phone-bar">
                  <details data-showcase-menu>
                    <summary class="mcx-icon-btn" data-showcase-toggle style="list-style:none">
                      <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-menu" /></svg>
                    </summary>
                    <div class="mcx-menu-popover" style="position:absolute;top:100%;left:0;right:0;margin-top:2px;z-index:20;border-radius:0 0 0.5rem 0.5rem">
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="0" role="menuitem">{$_('js.showcase.tab0')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="1" role="menuitem">{$_('js.showcase.tab1')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="2" role="menuitem">{$_('js.showcase.tab2')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="3" role="menuitem">{$_('js.showcase.tab3')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="4" role="menuitem">{$_('js.showcase.tab4')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="5" role="menuitem">{$_('js.showcase.tab5')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="6" role="menuitem">{$_('js.showcase.tab6')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="7" role="menuitem">{$_('js.showcase.tab7')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="8" role="menuitem">{$_('js.showcase.tab8')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="9" role="menuitem">{$_('js.showcase.tab9')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="10" role="menuitem">{$_('js.showcase.tab10')}</button>
                      <button type="button" class="touch-manipulation" data-showcase-mobile-item="11" role="menuitem">{$_('js.showcase.tab11')}</button>
                    </div>
                  </details>
                  <span class="mcx-phone-bar-title" data-showcase-label>{$_('js.showcase.tab0')}</span>
                  <span style="width:1.5rem;flex-shrink:0"></span>
                </div>
                <div class="mcx-phone-screen" data-showcase-screen role="presentation">
                  <div class="mcx-showcase-frame" data-showcase-frame>
                    <img class="mcx-showcase-shot hidden" alt="" data-showcase-img decoding="async" loading="lazy" />
                    <div class="mcx-showcase-placeholder" data-showcase-placeholder aria-hidden="true">
                      <svg class="mcx-icon mcx-icon--2xl mcx-muted-icon" aria-hidden="true"><use href="#i-message-text-outline" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-showcase-desktop>
            <div class="mcx-showcase-desktop mcx-glass-card">
              <div class="mcx-browser-chrome">
                <div class="mcx-dots" aria-hidden="true">
                  <span class="mcx-dot-r"></span>
                  <span class="mcx-dot-y"></span>
                  <span class="mcx-dot-g"></span>
                </div>
                <div class="mcx-url-bar"><span class="opacity-80 truncate">meshchatx</span></div>
              </div>
              <div class="mcx-tabs-row">
                <button type="button" class="mcx-tab is-active" data-showcase-tab="0">{$_('js.showcase.tab0')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="1">{$_('js.showcase.tab1')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="2">{$_('js.showcase.tab2')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="3">{$_('js.showcase.tab3')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="4">{$_('js.showcase.tab4')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="5">{$_('js.showcase.tab5')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="6">{$_('js.showcase.tab6')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="7">{$_('js.showcase.tab7')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="8">{$_('js.showcase.tab8')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="9">{$_('js.showcase.tab9')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="10">{$_('js.showcase.tab10')}</button>
                <button type="button" class="mcx-tab" data-showcase-tab="11">{$_('js.showcase.tab11')}</button>
              </div>
              <div class="mcx-tabs-mobile">
                <details data-showcase-menu>
                  <summary class="mcx-icon-btn" data-showcase-toggle style="list-style:none">
                    <svg class="mcx-icon" aria-hidden="true"><use href="#i-menu" /></svg>
                  </summary>
                  <div class="mcx-menu-popover" style="position:absolute;top:100%;left:0;right:0;margin-top:2px;z-index:10">
                    <button type="button" data-showcase-mobile-item="0" role="menuitem">{$_('js.showcase.tab0')}</button>
                    <button type="button" data-showcase-mobile-item="1" role="menuitem">{$_('js.showcase.tab1')}</button>
                    <button type="button" data-showcase-mobile-item="2" role="menuitem">{$_('js.showcase.tab2')}</button>
                    <button type="button" data-showcase-mobile-item="3" role="menuitem">{$_('js.showcase.tab3')}</button>
                    <button type="button" data-showcase-mobile-item="4" role="menuitem">{$_('js.showcase.tab4')}</button>
                    <button type="button" data-showcase-mobile-item="5" role="menuitem">{$_('js.showcase.tab5')}</button>
                    <button type="button" data-showcase-mobile-item="6" role="menuitem">{$_('js.showcase.tab6')}</button>
                    <button type="button" data-showcase-mobile-item="7" role="menuitem">{$_('js.showcase.tab7')}</button>
                    <button type="button" data-showcase-mobile-item="8" role="menuitem">{$_('js.showcase.tab8')}</button>
                    <button type="button" data-showcase-mobile-item="9" role="menuitem">{$_('js.showcase.tab9')}</button>
                    <button type="button" data-showcase-mobile-item="10" role="menuitem">{$_('js.showcase.tab10')}</button>
                    <button type="button" data-showcase-mobile-item="11" role="menuitem">{$_('js.showcase.tab11')}</button>
                  </div>
                </details>
                <span data-showcase-label>{$_('js.showcase.tab0')}</span>
              </div>
              <div class="mcx-desktop-screen" data-showcase-screen role="presentation">
                <div class="mcx-showcase-frame" data-showcase-frame>
                  <img
                    class="mcx-showcase-shot mcx-showcase-shot--desktop"
                    src="/showcase/dark/tab-11-home.webp"
                    alt=""
                    data-showcase-img
                    decoding="async"
                    loading="lazy"
                  />
                  <div class="mcx-showcase-placeholder hidden" data-showcase-placeholder aria-hidden="true">
                    <svg class="mcx-icon mcx-muted-icon" style="width:3rem;height:3rem" aria-hidden="true"><use href="#i-message-text-outline" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
