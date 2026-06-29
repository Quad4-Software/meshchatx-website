<script lang="ts">
  let {
    status,
    title,
    lead,
    homeLabel,
    homeHref,
    downloadLabel,
    downloadHref,
  } = $props<{
    status: number;
    title: string;
    lead: string;
    homeLabel: string;
    homeHref: string;
    downloadLabel: string;
    downloadHref: string;
  }>();

  const is404 = $derived(status === 404);
</script>

<section class="mcx-page-head mcx-page-head--center" aria-labelledby="mcx-error-h1">
  <div class="mcx-container mcx-container--narrow">
    <div class="mcx-page-icon-wrap mcx-page-icon-wrap--blue" aria-hidden="true">
      {#if is404}
        <svg class="mcx-icon mcx-icon--2xl" aria-hidden="true"><use href="#i-magnify" /></svg>
      {:else}
        <svg class="mcx-icon mcx-icon--2xl" aria-hidden="true"><use href="#i-alert-circle-outline" /></svg>
      {/if}
    </div>
    <p class="mcx-error-eyebrow" aria-hidden="true">{status}</p>
    <h1 id="mcx-error-h1">{title}</h1>
    <p class="mcx-hero-lead" style="margin-top:0.5rem;">{lead}</p>
    <div class="mcx-hero-cta" style="margin-top:1.5rem;">
      <a class="mcx-btn-primary" href={homeHref}>{homeLabel}</a>
      <a class="mcx-btn-ghost" href={downloadHref}>{downloadLabel}</a>
    </div>
  </div>
</section>
