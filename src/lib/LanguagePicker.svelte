<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { page } from '$app/state';
  import { LOCALES, langNativeLabel, type AppLocale } from '$lib/merge-messages';
  import { crossLangHref, pageIdFromPathname } from '$lib/paths';

  let { locale, mobile = false } = $props<{
    locale: AppLocale;
    mobile?: boolean;
  }>();

  const currentPage = $derived(pageIdFromPathname(page.url?.pathname ?? '/'));
  const hrefL = (to: AppLocale) => crossLangHref(locale, to, currentPage);
  const act = (x: AppLocale) => (locale === x ? ('page' as const) : undefined);

  function closePicker(e: MouseEvent) {
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const det = target.closest('details');
    if (det) det.open = false;
  }
</script>

<details class="mcx-lang-picker" class:mcx-lang-picker--mobile={mobile}>
  <summary aria-label={$_('lang.pick')}>
    <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-translate" /></svg>
    <span class="mcx-lang-picker__current">{langNativeLabel(locale)}</span>
    <svg class="mcx-icon mcx-icon--xs mcx-lang-picker__chevron" aria-hidden="true"
      ><use href="#i-chevron-down" /></svg
    >
  </summary>
  <div class="mcx-lang-picker__menu" role="menu">
    {#each LOCALES as l (l)}
      <a
        role="menuitem"
        href={hrefL(l)}
        hreflang={l}
        lang={l}
        aria-current={act(l)}
        onclick={closePicker}>{langNativeLabel(l)}</a
      >
    {/each}
  </div>
</details>
