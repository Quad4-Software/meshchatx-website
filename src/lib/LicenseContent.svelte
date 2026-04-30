<script lang="ts">
  import { _ } from 'svelte-i18n';
</script>

<section class="mcx-page-head mcx-license-page">
  <div class="mcx-container">
    <h1>{$_('license.h1')}</h1>
    <p class="mcx-license-intro">{$_('license.intro')}</p>
    <h2 class="mcx-license-section-title">{$_('license.h2_website')}</h2>
    <div class="mcx-license-block">{$_('license.body')}</div>
    <h2 class="mcx-license-section-title">{$_('license.h2_app')}</h2>
    <p class="mcx-license-app-lead">{$_('license.app_intro')}</p>
    <div class="mcx-license-block">{$_('license.app_body')}</div>
  </div>
</section>
