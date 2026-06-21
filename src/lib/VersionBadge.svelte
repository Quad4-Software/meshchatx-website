<script lang="ts">
  import type { McxReleasesPayload } from "$lib/github-releases.server";
  import { MESHCHATX_CHANGELOG } from "$lib/meshchatx-repo";
  import { _ } from "svelte-i18n";

  let { releases } = $props<{ releases: McxReleasesPayload }>();

  const version = $derived(
    releases.stable?.version ?? releases.prerelease?.version ?? null,
  );
  const label = $derived(
    version ? $_("js.home.version_here").replace("%s", version) : null,
  );
</script>

{#if label}
  <a
    class="mcx-version-pill mcx-badge-enter"
    data-version-badge
    href={MESHCHATX_CHANGELOG}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="mcx-pulse" aria-hidden="true"></span>
    <span data-version-text>{label}</span>
  </a>
{/if}
