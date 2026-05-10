<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { AppLocale } from '$lib/merge-messages';
  import { MESHCHATX_CHANGELOG, MESHCHATX_GITHUB } from '$lib/meshchatx-repo';
  import { appPath } from '$lib/paths';

  const { locale: loc } = $props<{ locale: AppLocale }>();
</script>

<footer class="mcx-footer">
  <div class="mcx-container mcx-footer__grid">
    <div class="mcx-footer__brand">
      <div class="mcx-brand mcx-brand--footer">
        <img
          class="mcx-brand__logo mcx-brand__logo--footer"
          src="/logo-navbar.webp"
          alt={$_('brand.name')}
          width="96"
          height="32"
          loading="lazy"
          decoding="async"
        />
        <span class="mcx-brand__text mcx-brand__text--footer">{$_('brand.name')}</span>
      </div>
      <p style="max-width:24rem;line-height:1.625">{$_('footer.tagline')}</p>
    </div>
    <div>
      <h4>{$_('footer.community')}</h4>
      <ul>
        <li>
          <a href={MESHCHATX_GITHUB} target="_blank" rel="noopener noreferrer">{$_('footer.source')}</a>
        </li>
        <li>
          <a href={MESHCHATX_CHANGELOG} target="_blank" rel="noopener noreferrer">{$_('footer.changelog')}</a>
        </li>
        <li><a href={appPath(loc, 'roadmap')}>{$_('nav.roadmap')}</a></li>
        <li><a href={appPath(loc, 'donate')}>{$_('nav.donate')}</a></li>
        <li><a href={appPath(loc, 'contact')}>{$_('nav.contact')}</a></li>
      </ul>
    </div>
    <div>
      <h4>{$_('footer.legal')}</h4>
      <ul>
        <li>
          <a
            href="https://git.quad4.io/websites/meshchatx/src/branch/master/LICENSE"
            class="mcx-footer-license"
            target="_blank"
            rel="noopener noreferrer"
          >
            {$_('footer.license')}
            <span class="mcx-badge-mit">{$_('footer.license_badge')}</span>
          </a>
        </li>
        <li><a href={appPath(loc, 'privacy')}>{$_('footer.privacy')}</a></li>
      </ul>
    </div>
  </div>
  <div class="mcx-container mcx-footer__meta">
    <p>{$_('footer.meta_copyright')}</p>
    <p
      class="font-normal normal-case tracking-normal"
      style="font-weight:400;letter-spacing:normal;text-transform:none"
    >
      {@html $_('footer.meta_site')}
    </p>
  </div>
</footer>
