<script lang="ts">
  let {
    status,
    title,
    lead,
    homeLabel,
    homeHref,
  } = $props<{
    status: number;
    title: string;
    lead: string;
    homeLabel: string;
    homeHref: string;
  }>();
</script>

<section
  class="mcx-page-head mcx-page-head--center"
  aria-labelledby="mcx-error-h1"
>
  <div class="mcx-container mcx-container--narrow">
    <p class="mcx-error-eyebrow" aria-hidden="true">{status}</p>
    <h1 id="mcx-error-h1">{title}</h1>
    <p class="mcx-hero-lead" style="margin-top:0.5rem;">{lead}</p>
    <div class="mcx-hero-cta" style="margin-top:1.5rem;">
      <a class="mcx-btn-primary" href={homeHref}>{homeLabel}</a>
    </div>
  </div>
</section>
