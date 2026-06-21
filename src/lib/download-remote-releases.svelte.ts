import { browser } from "$app/environment";
import { hasReleaseData } from "$lib/download-page";
import type { McxReleasesPayload } from "$lib/github-releases.server";

export function useDownloadReleases(serverReleases: () => McxReleasesPayload) {
  let remoteReleases = $state<McxReleasesPayload | null>(null);

  $effect(() => {
    serverReleases();
    remoteReleases = null;
  });

  $effect(() => {
    const server = serverReleases();
    if (!browser || hasReleaseData(server)) return;
    let cancelled = false;
    fetch("/api/mcx-releases", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (
          !cancelled &&
          payload &&
          hasReleaseData(payload as McxReleasesPayload)
        ) {
          remoteReleases = payload as McxReleasesPayload;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  });

  return {
    get releases(): McxReleasesPayload {
      return remoteReleases ?? serverReleases();
    },
  };
}
