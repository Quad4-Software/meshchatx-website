<script lang="ts">
  let { path, class: className = 'mcx-icon' } = $props<{
    path: string;
    class?: string;
  }>();
</script>

<svg
  class={className}
  viewBox="0 0 24 24"
  width="1.25em"
  height="1.25em"
  aria-hidden="true"
  style="flex-shrink:0;vertical-align:middle"
>
  <path fill="currentColor" d={path} />
</svg>
