<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { AppLocale } from '$lib/merge-messages';
  import LanguagePicker from '$lib/LanguagePicker.svelte';
  import { appPath } from '$lib/paths';
  import ThemeToggle from '$lib/ThemeToggle.svelte';

  let { locale: loc } = $props<{ locale: AppLocale }>();
  const home = $derived(appPath(loc, 'home', ''));
  const homeFeatures = $derived(appPath(loc, 'home', 'features'));
  const homeShowcase = $derived(appPath(loc, 'home', 'showcase'));
</script>

<header class="mcx-site-header">
  <a class="mcx-brand" href={home}>
    <img
      class="mcx-brand__logo"
      src="/logo-navbar.webp"
      alt={$_('brand.name')}
      width="120"
      height="40"
      decoding="async"
    />
    <span class="mcx-brand__text">{$_('brand.name')}</span>
  </a>
  <nav class="mcx-nav-desktop" aria-label={$_('nav.primary')}>
    <a href={homeFeatures}>{$_('nav.features')}</a>
    <a href={homeShowcase}>{$_('nav.showcase')}</a>
    <a href={appPath(loc, 'contact')}>{$_('nav.contact')}</a>
  </nav>
  <div class="mcx-header-actions">
    <LanguagePicker locale={loc} />
    <ThemeToggle />
    <a class="mcx-btn-primary mcx-btn-header" href={appPath(loc, 'download')}>{$_('nav.download')}</a>
    <details class="mcx-nav-mobile">
      <summary aria-label={$_('nav.mobile_menu')}>
        <svg class="mcx-icon" aria-hidden="true"><use href="#i-menu" /></svg>
      </summary>
      <div class="mcx-nav-mobile__panel">
        <nav aria-label={$_('nav.mobile_nav')}>
          <a href={homeFeatures}>{$_('nav.features')}</a>
          <a href={homeShowcase}>{$_('nav.showcase')}</a>
          <a href={appPath(loc, 'download')}>{$_('nav.download')}</a>
          <a href={appPath(loc, 'contact')}>{$_('nav.contact')}</a>
        </nav>
        <div class="mcx-nav-mobile__footer">
          <LanguagePicker locale={loc} mobile />
          <ThemeToggle showLabel />
          <a
            class="mcx-btn-primary"
            href={appPath(loc, 'download')}
            onclick={(e) => {
              const det = e.currentTarget.closest('details');
              if (det) det.open = false;
            }}>{$_('nav.download')}</a
          >
        </div>
      </div>
    </details>
  </div>
</header>
