<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    if (!browser) return;
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: true });
      })
      .catch(() => {});
  });
</script>

{@render children()}
