<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { page } from '$app/state';
  import type { AppLocale } from '$lib/merge-messages';
  import { MESHCHATX_GITHUB } from '$lib/meshchatx-repo';
  import { appPath, crossLangHref, pageIdFromPathname, type PageId } from '$lib/paths';

  let { locale: loc } = $props<{ locale: AppLocale }>();
  const current = $derived(pageIdFromPathname(page.url?.pathname ?? '/')) as PageId;
  const hrefL = (to: AppLocale) => crossLangHref(loc, to, current);
  const act = (x: AppLocale) => (loc === x ? 'page' as const : undefined);
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
    <a href={appPath(loc, 'donate')}>{$_('nav.donate')}</a>
    <a href={appPath(loc, 'contact')}>{$_('nav.contact')}</a>
    <a href={MESHCHATX_GITHUB} target="_blank" rel="noopener noreferrer">{$_('nav.git')}</a>
  </nav>
  <div class="mcx-header-actions">
    <div class="mcx-lang" role="navigation" aria-label={$_('lang.label')}>
      <a class="mcx-lang__link" href={hrefL('en')} hreflang="en" lang="en" aria-current={act('en')}>EN</a>
      <a class="mcx-lang__link" href={hrefL('de')} hreflang="de" lang="de" aria-current={act('de')}>DE</a>
      <a class="mcx-lang__link" href={hrefL('ru')} hreflang="ru" lang="ru" aria-current={act('ru')}>RU</a>
      <a class="mcx-lang__link" href={hrefL('it')} hreflang="it" lang="it" aria-current={act('it')}>IT</a>
    </div>
    <button type="button" class="mcx-theme-btn" data-theme-toggle aria-label={$_('nav.toggle_theme')}>
      <svg class="mcx-icon mcx-icon--md" aria-hidden="true"><use href="#i-weather-night" /></svg>
    </button>
    <a class="mcx-btn-primary mcx-btn-header" href={appPath(loc, 'download')}>{$_('nav.download')}</a>
    <details class="mcx-nav-mobile">
      <summary aria-label={$_('nav.mobile_menu')}>
        <svg class="mcx-icon" aria-hidden="true"><use href="#i-menu" /></svg>
      </summary>
      <div class="mcx-nav-mobile__panel">
        <nav aria-label={$_('nav.mobile_nav')}>
          <a href={homeFeatures}>{$_('nav.features')}</a>
          <a href={homeShowcase}>{$_('nav.showcase')}</a>
          <a href={appPath(loc, 'donate')}>{$_('nav.donate')}</a>
          <a href={appPath(loc, 'contact')}>{$_('nav.contact')}</a>
          <a href={MESHCHATX_GITHUB} target="_blank" rel="noopener noreferrer">{$_('nav.git')}</a>
        </nav>
        <div class="mcx-lang mcx-lang--mobile" role="navigation" aria-label={$_('lang.label')}>
          <a class="mcx-lang__link" href={hrefL('en')} hreflang="en" lang="en" aria-current={act('en')}>EN</a
          >
          <a class="mcx-lang__link" href={hrefL('de')} hreflang="de" lang="de" aria-current={act('de')}>DE</a
          >
          <a class="mcx-lang__link" href={hrefL('ru')} hreflang="ru" lang="ru" aria-current={act('ru')}>RU</a
          >
          <a class="mcx-lang__link" href={hrefL('it')} hreflang="it" lang="it" aria-current={act('it')}>IT</a
          >
        </div>
        <div class="mcx-nav-mobile__footer">
          <button
            type="button"
            class="mcx-theme-btn"
            data-theme-toggle
            aria-label={$_('nav.toggle_theme')}
          >
            <svg class="mcx-icon mcx-icon--md" id="mcx-mobile-theme-icon" aria-hidden="true"
              ><use href="#i-weather-night" /></svg
            >
            <span id="mcx-mobile-theme-label"></span>
          </button>
          <a
            class="mcx-btn-primary"
            href={appPath(loc, 'download', 'android')}
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
