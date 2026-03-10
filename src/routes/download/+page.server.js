import { parseRelease } from '$lib/releases.js';

const GITEA_RELEASES = 'https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25';

/**
 * @param {string | null} publishedAt ISO date string
 * @returns {string | null}
 */
function formatRelativeTime(publishedAt) {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

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
        publishedAtRelative: null,
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
      publishedAtRelative: null,
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
    publishedAtRelative: formatRelativeTime(selectedRelease.publishedAt),
    error: null
  };
}
