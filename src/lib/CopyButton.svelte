<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    text,
    title = "Copy",
    class: className = "",
    style = "",
    children,
  } = $props<{
    text: string;
    title?: string;
    class?: string;
    style?: string;
    children?: Snippet;
  }>();

  let copied = $state(false);

  async function copy() {
    if (!text || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<button
  type="button"
  class="mcx-copy-btn {className}"
  {style}
  {title}
  onclick={copy}
>
  {#if children}
    {@render children()}
  {:else}
    <svg class="mcx-icon mcx-icon--sm" aria-hidden="true">
      <use href={copied ? "#i-check" : "#i-content-copy"} />
    </svg>
  {/if}
</button>
