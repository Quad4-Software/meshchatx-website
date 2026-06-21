<script lang="ts">
  import { browser } from "$app/environment";
  import { _ } from "svelte-i18n";
  import {
    SHOWCASE_TAB_COUNT,
    showcaseShotUrl,
    showcaseTabKey,
  } from "$lib/showcase";
  import { theme } from "$lib/theme.svelte";

  let {
    assetsBase = "/showcase/",
    desktopOnly = true,
  } = $props<{
    assetsBase?: string;
    desktopOnly?: boolean;
  }>();

  let activeTab = $state(0);
  let view = $state<"mobile" | "desktop">("desktop");
  let mobileMenuOpen = $state(false);
  let tabsMenuOpen = $state(false);
  let displaySrc = $state("");
  let imageReady = $state(false);

  const tabIndices = Array.from({ length: SHOWCASE_TAB_COUNT }, (_, i) => i);
  const activeLabel = $derived($_(showcaseTabKey(activeTab)));
  const targetUrl = $derived(
    showcaseShotUrl(assetsBase, activeTab, theme.isDark),
  );

  $effect(() => {
    if (!browser) return;
    if (desktopOnly) {
      view = "desktop";
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      view = mq.matches ? "desktop" : "mobile";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  });

  $effect(() => {
    if (!browser) return;
    const url = targetUrl;
    imageReady = false;
    const img = new Image();
    img.onload = () => {
      displaySrc = url;
      imageReady = true;
    };
    img.src = url;
  });

  function selectTab(index: number) {
    activeTab = index;
    mobileMenuOpen = false;
    tabsMenuOpen = false;
  }

  function closeMenus() {
    mobileMenuOpen = false;
    tabsMenuOpen = false;
  }
</script>

<div id="showcase" class="mcx-showcase-wrap">
  {#if !desktopOnly}
    <div class="mcx-toggle-pair" aria-hidden="true">
      <button
        type="button"
        class="mcx-toggle"
        class:is-active={view === "mobile"}
        title={$_("home.showcase.mobile")}
        aria-label={$_("home.showcase.mobile")}
        tabindex="-1"
        onclick={() => (view = "mobile")}
      >
        <svg class="mcx-icon mcx-icon--md" aria-hidden="true"><use href="#i-cellphone" /></svg>
      </button>
      <button
        type="button"
        class="mcx-toggle"
        class:is-active={view === "desktop"}
        title={$_("home.showcase.desktop")}
        aria-label={$_("home.showcase.desktop")}
        tabindex="-1"
        onclick={() => (view = "desktop")}
      >
        <svg class="mcx-icon mcx-icon--md" aria-hidden="true"><use href="#i-monitor" /></svg>
      </button>
    </div>
  {/if}

  {#if !desktopOnly && view === "mobile"}
    <div>
      <div class="mcx-flex-center">
        <div class="mcx-showcase-phone">
          <div class="mcx-phone-notch"><span></span></div>
          <div class="mcx-phone-bar">
            <details bind:open={mobileMenuOpen}>
              <summary class="mcx-icon-btn" style="list-style:none">
                <svg class="mcx-icon mcx-icon--sm" aria-hidden="true">
                  <use href={mobileMenuOpen ? "#i-close" : "#i-menu"} />
                </svg>
              </summary>
              <div
                class="mcx-menu-popover"
                style="position:absolute;top:100%;left:0;right:0;margin-top:2px;z-index:20;border-radius:0 0 0.5rem 0.5rem"
              >
                {#each tabIndices as index (index)}
                  <button
                    type="button"
                    class="touch-manipulation"
                    class:is-active={activeTab === index}
                    role="menuitem"
                    onclick={() => selectTab(index)}
                  >
                    {$_(showcaseTabKey(index))}
                  </button>
                {/each}
              </div>
            </details>
            <span class="mcx-phone-bar-title">{activeLabel}</span>
            <span style="width:1.5rem;flex-shrink:0"></span>
          </div>
          <div class="mcx-phone-screen" role="presentation" onclick={closeMenus}>
            <div class="mcx-showcase-frame">
              {#if imageReady}
                <img
                  class="mcx-showcase-shot"
                  src={displaySrc}
                  alt=""
                  decoding="async"
                  loading="lazy"
                />
              {:else}
                <div class="mcx-showcase-placeholder" aria-hidden="true">
                  <svg class="mcx-icon mcx-icon--2xl mcx-muted-icon" aria-hidden="true">
                    <use href="#i-message-text-outline" />
                  </svg>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if desktopOnly || view === "desktop"}
    <div>
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
          {#each tabIndices as index (index)}
            <button
              type="button"
              class="mcx-tab"
              class:is-active={activeTab === index}
              onclick={() => selectTab(index)}
            >
              {$_(showcaseTabKey(index))}
            </button>
          {/each}
        </div>
        <div class="mcx-tabs-mobile">
          <details bind:open={tabsMenuOpen}>
            <summary class="mcx-icon-btn" style="list-style:none">
              <svg class="mcx-icon" aria-hidden="true">
                <use href={tabsMenuOpen ? "#i-close" : "#i-menu"} />
              </svg>
            </summary>
            <div
              class="mcx-menu-popover"
              style="position:absolute;top:100%;left:0;right:0;margin-top:2px;z-index:10"
            >
              {#each tabIndices as index (index)}
                <button
                  type="button"
                  class:is-active={activeTab === index}
                  role="menuitem"
                  onclick={() => selectTab(index)}
                >
                  {$_(showcaseTabKey(index))}
                </button>
              {/each}
            </div>
          </details>
          <span>{activeLabel}</span>
        </div>
        <div class="mcx-desktop-screen" role="presentation" onclick={closeMenus}>
          <div class="mcx-showcase-frame">
            {#if imageReady}
              <img
                class="mcx-showcase-shot mcx-showcase-shot--desktop"
                src={displaySrc}
                alt=""
                decoding="async"
                loading="lazy"
              />
            {:else}
              <div class="mcx-showcase-placeholder" aria-hidden="true">
                <svg
                  class="mcx-icon mcx-muted-icon"
                  style="width:3rem;height:3rem"
                  aria-hidden="true"
                >
                  <use href="#i-message-text-outline" />
                </svg>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
