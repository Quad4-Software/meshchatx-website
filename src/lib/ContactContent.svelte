<script lang="ts">
  import { _ } from 'svelte-i18n';
</script>

<section class="mcx-page-head mcx-page-head--center">
  <div class="mcx-container mcx-container--narrow">
    <div class="mcx-page-icon-wrap mcx-page-icon-wrap--blue">
      <svg class="mcx-icon mcx-icon--2xl" aria-hidden="true"><use href="#i-message-text-outline" /></svg>
    </div>
    <h1>{$_('contact.h1')}</h1>
    <div class="mcx-glass-card mcx-glass-panel">
      <h2 class="mcx-contact-card-title">{$_('contact.panel_title')}</h2>
      <div class="mcx-copy-field">
        <div class="mcx-mono-block" id="mcx-lxmf-addr">7cc8d66b4f6a0e0e49d34af7f6077b5a</div>
        <button type="button" class="mcx-copy-btn" data-copy="7cc8d66b4f6a0e0e49d34af7f6077b5a" title="{$_('contact.copy_title')}">
          <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
        </button>
      </div>
    </div>
    <div class="mcx-glass-card mcx-glass-panel mcx-glass-panel--orange mcx-contact-email-panel">
      <h2 class="mcx-contact-card-title">{$_('contact.panel_email')}</h2>
      <p class="mcx-contact-email-lead">{$_('contact.email_lead')}</p>
      <div class="mcx-copy-field">
        <a
          class="mcx-mono-block mcx-contact-email-link"
          href={`mailto:${$_('contact.email')}`}
          id="mcx-team-email">{$_('contact.email')}</a>
        <button type="button" class="mcx-copy-btn" data-copy={$_('contact.email')} title="{$_('contact.copy_email')}">
          <svg class="mcx-icon mcx-icon--sm" aria-hidden="true"><use href="#i-content-copy" /></svg>
        </button>
      </div>
    </div>
  </div>
</section>
