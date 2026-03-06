const GITEA_RELEASES = 'https://git.quad4.io/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
  let version = null;
  let platforms = {
    macos: false,
    linux: false,
    windows: false,
    docker: true,
    python: false,
    termux: false
  };
  try {
    const res = await fetch(GITEA_RELEASES, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const releases = await res.json();
      const list = Array.isArray(releases) ? releases : [];
      const published = list.filter((r) => !r?.draft);
      const release = published.find((r) => !r?.prerelease) ?? published[0] ?? null;
      if (release) {
        version = release.tag_name?.replace(/^v/, '') ?? null;
        const assets = release.assets ?? [];
        const hasAppImage = assets.some((a) => a.name && a.name.endsWith('.AppImage') && /linux/i.test(a.name));
        const hasWheel = assets.some((a) => a.name && a.name.endsWith('-py3-none-any.whl'));
        const hasWin = assets.some((a) => a.name && (/win.*installer\.exe$/i.test(a.name) || /win.*portable\.exe$/i.test(a.name)));
        platforms = {
          macos: false,
          linux: !!hasAppImage,
          windows: !!hasWin,
          docker: true,
          python: !!hasWheel,
          termux: !!hasWheel
        };
      }
    }
  } catch (e) {
    // Silently fail
  }

  return {
    version,
    platforms
  };
}
