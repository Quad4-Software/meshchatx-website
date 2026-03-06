import { parseRelease } from '$lib/releases.js';

const GITEA_RELEASES = 'https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders, url }) {
  setHeaders({
    'cache-control': 'public, max-age=300'
  });
  let stableRelease = null;
  let preRelease = null;
  let selectedRelease = null;
  let selectedChannel = 'stable';

  try {
    const res = await fetch(GITEA_RELEASES, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Gitea API ${res.status}`);
    const releases = await res.json();
    const releaseList = Array.isArray(releases) ? releases : [];
    const publishedReleases = releaseList.filter((r) => !r?.draft);

    const latestStable = publishedReleases.find((r) => !r?.prerelease) ?? null;
    const latestPrerelease = publishedReleases.find((r) => Boolean(r?.prerelease)) ?? null;

    stableRelease = parseRelease(latestStable);
    preRelease = parseRelease(latestPrerelease);

    const requestedChannel = url.searchParams.get('channel');
    const wantsPrerelease = requestedChannel === 'prerelease';
    if (wantsPrerelease && preRelease) {
      selectedChannel = 'prerelease';
      selectedRelease = preRelease;
    } else if (stableRelease) {
      selectedChannel = 'stable';
      selectedRelease = stableRelease;
    } else if (preRelease) {
      selectedChannel = 'prerelease';
      selectedRelease = preRelease;
    }

    if (!selectedRelease) {
      return {
        stableRelease,
        preRelease,
        selectedRelease,
        selectedChannel,
        hasStableRelease: false,
        hasPreRelease: false,
        error: null
      };
    }
  } catch (e) {
    return {
      stableRelease,
      preRelease,
      selectedRelease,
      selectedChannel,
      hasStableRelease: Boolean(stableRelease),
      hasPreRelease: Boolean(preRelease),
      error: e?.message ?? 'Failed to fetch releases'
    };
  }

  return {
    stableRelease,
    preRelease,
    selectedRelease,
    selectedChannel,
    hasStableRelease: Boolean(stableRelease),
    hasPreRelease: Boolean(preRelease),
    error: null
  };
}
