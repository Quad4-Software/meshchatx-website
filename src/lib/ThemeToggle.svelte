<script lang="ts">
  import { _ } from "svelte-i18n";
  import { theme } from "$lib/theme.svelte";

  let { showLabel = false, class: className = "mcx-theme-btn" } = $props<{
    showLabel?: boolean;
    class?: string;
  }>();

  const icon = $derived(theme.isDark ? "#i-weather-sunny" : "#i-weather-night");
  const mobileLabel = $derived(
    theme.isDark ? $_("js.theme.mobile_light") : $_("js.theme.mobile_dark"),
  );
  const ariaLabel = $derived(
    theme.isDark ? $_("js.theme.toggle_light") : $_("js.theme.toggle_dark"),
  );
</script>

<button type="button" class={className} aria-label={ariaLabel} onclick={() => theme.toggle()}>
  <svg class="mcx-icon mcx-icon--md" aria-hidden="true">
    <use href={icon} />
  </svg>
  {#if showLabel}
    <span>{mobileLabel}</span>
  {/if}
</button>
