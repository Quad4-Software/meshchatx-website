<script lang="ts">
  import type { McxReleasesPayload } from "$lib/github-releases.server";
  import { formatPublishedAgo } from "$lib/format-published-ago";
  import { channelFromSearch, hasReleaseData, selectDownloadRelease } from "$lib/download-page";
  import { MESHCHATX_RELEASES } from "$lib/meshchatx-repo";
  import { page } from "$app/state";
  import { _ } from "svelte-i18n";

  let { releases, locale } = $props<{
    releases: McxReleasesPayload;
    locale: string;
  }>();

  const channel = $derived(channelFromSearch(page.url.search));
  const selection = $derived(selectDownloadRelease(releases, channel));
  const selectedRelease = $derived(selection.release);
  const selectedChannel = $derived(selection.channel);
  const publishedAtRelative = $derived(
    selectedRelease?.publishedAt
      ? formatPublishedAgo(
          selectedRelease.publishedAt,
          {
            justNow: $_("js.download.published_just_now"),
            prefix: $_("js.download.published_prefix"),
          },
          { locale },
        )
      : null,
  );
  const hasData = $derived(hasReleaseData(releases));
  const channelPath = $derived(page.url.pathname);
  const channelHash = $derived(page.url.hash);
</script>

<p class="mcx-muted" style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem">
  {#if selectedRelease?.version}
    <span>
      {$_("js.download.latest")}
      {selectedChannel === "prerelease"
        ? $_("js.download.prerelease")
        : $_("js.download.stable")}
      : v{selectedRelease.version}
      <span class="mcx-badge-pill">
        {selectedChannel === "prerelease"
          ? $_("js.download.prerelease")
          : $_("js.download.stable")}
      </span>
      {#if publishedAtRelative}
        <span class="mcx-muted mcx-text-sm"> · {publishedAtRelative}</span>
      {/if}
      {#if releases.stable && releases.prerelease}
        <span class="mcx-channel-pill">
          <a
            href="{channelPath}{channelHash}"
            class:is-active-stable={selectedChannel === "stable"}
          >
            {$_("js.download.channel_stable")}
          </a>
          <a
            href="{channelPath}?channel=prerelease{channelHash}"
            class:is-active-pre={selectedChannel === "prerelease"}
          >
            {$_("js.download.channel_pre")}
          </a>
        </span>
      {/if}
    </span>
  {:else if hasData}
    <span>{$_("js.download.no_release")}</span>
  {:else}
    <span class="mcx-js-only">{$_("dl.loading")}</span>
    <noscript>
      <span>
        {$_("dl.meta_noscript")}
        <a
          href={MESHCHATX_RELEASES}
          class="mcx-link-blue"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Quad4-Software/MeshChatX/releases
        </a>
      </span>
    </noscript>
  {/if}
</p>

{#if selectedRelease?.sbomUrl}
  <p class="mcx-text-sm" style="margin-top:0.35rem">
    <a
      class="mcx-link-blue"
      style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase"
      href={selectedRelease.sbomUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {$_("dl.sbom")}
    </a>
  </p>
{/if}
