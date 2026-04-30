<script lang="ts">
  let { title, description } = $props<{
    title: string;
    description: string;
  }>();
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>
