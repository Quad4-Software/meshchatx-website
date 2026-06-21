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
  let tabsMenuOpen = $state(false);
  let displaySrc = $state("");
  let imageReady = $state(false);
  let isMobileViewport = $state(false);
  let swipeStartX = $state<number | null>(null);

  const SWIPE_THRESHOLD_PX = 48;

  const tabIndices = Array.from({ length: SHOWCASE_TAB_COUNT }, (_, i) => i);
  const activeLabel = $derived($_(showcaseTabKey(activeTab)));
  const targetUrl = $derived(
    showcaseShotUrl(assetsBase, activeTab, theme.isDark),
  );
  const shotAlt = $derived(
    $_("js.showcase.desktop_fmt").replace("%s", activeLabel),
  );
  const showCarousel = $derived(
    isMobileViewport || (!desktopOnly && view === "mobile"),
  );

  $effect(() => {
    if (!browser) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      isMobileViewport = mq.matches;
      if (desktopOnly) {
        view = "desktop";
        return;
      }
      view = mq.matches ? "mobile" : "desktop";
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
    tabsMenuOpen = false;
  }

  function goNextTab() {
    activeTab = (activeTab + 1) % SHOWCASE_TAB_COUNT;
    tabsMenuOpen = false;
  }

  function goPrevTab() {
    activeTab = (activeTab - 1 + SHOWCASE_TAB_COUNT) % SHOWCASE_TAB_COUNT;
    tabsMenuOpen = false;
  }

  function closeMenus() {
    tabsMenuOpen = false;
  }

  function onSwipeStart(clientX: number) {
    swipeStartX = clientX;
  }

  function onSwipeEnd(clientX: number) {
    if (swipeStartX === null) return;
    const delta = clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNextTab();
    else goPrevTab();
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onSwipeStart(e.clientX);
  }

  function onPointerUp(e: PointerEvent) {
    onSwipeEnd(e.clientX);
  }

  function onPointerCancel() {
    swipeStartX = null;
  }
</script>

<div id="showcase" class="mcx-showcase-wrap">
  {#if !desktopOnly && !isMobileViewport}
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

  {#if showCarousel}
    <div
      class="mcx-showcase-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={$_("nav.showcase")}
      onpointerdown={onPointerDown}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
      onpointerleave={onPointerCancel}
    >
      <div class="mcx-showcase-carousel__frame">
        <div class="mcx-showcase-frame">
          {#if imageReady}
            <img
              class="mcx-showcase-shot mcx-showcase-shot--carousel"
              src={displaySrc}
              alt={shotAlt}
              decoding="async"
              loading="lazy"
              draggable="false"
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
      <p class="mcx-showcase-carousel__label" aria-live="polite">{activeLabel}</p>
      <div class="mcx-showcase-carousel__dots">
        {#each tabIndices as index (index)}
          <button
            type="button"
            class="mcx-showcase-carousel__dot"
            class:is-active={activeTab === index}
            aria-label={$_(showcaseTabKey(index))}
            aria-current={activeTab === index ? "true" : undefined}
            onclick={() => selectTab(index)}
          ></button>
        {/each}
      </div>
    </div>
  {:else}
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
                alt={shotAlt}
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
