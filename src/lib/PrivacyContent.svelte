<script lang="ts">
  import { _ } from "svelte-i18n";
</script>

<section class="mcx-page-head mcx-license-page mcx-privacy-page">
  <div class="mcx-container">
    <h1>{$_('privacy.h1')}</h1>
    <p class="mcx-privacy-updated">{$_('privacy.updated')}</p>
    <div class="mcx-privacy-prose">
      <p>{$_('privacy.p_scope')}</p>
      <h2>{$_('privacy.h2_analytics')}</h2>
      <p>{$_('privacy.p_analytics')}</p>
      <p>{$_('privacy.p_analytics_detail')}</p>
      <h2>{$_('privacy.h2_rights')}</h2>
      <p>{$_('privacy.p_rights')}</p>
      <h2>{$_('privacy.h2_contact')}</h2>
      <p>{@html $_('privacy.p_contact')}</p>
    </div>
  </div>
</section>
