/**
 * @param {{ name?: string; browser_download_url?: string }[]} assets
 * @param {(name: string) => boolean} matcher
 * @returns {string | null}
 */
function getAssetUrl(assets, matcher) {
  const asset = assets.find((a) => a.name && matcher(a.name));
  return asset?.browser_download_url ?? null;
}

/**
 * @param {{ tag_name?: string; html_url?: string; published_at?: string; prerelease?: boolean; assets?: Array<{ name?: string; browser_download_url?: string }> } | null} release
 * @returns {{ version: string | null; releaseUrl: string | null; publishedAt: string | null; isPrerelease: boolean; appImageAmd64Url: string | null; appImageArm64Url: string | null; debAmd64Url: string | null; debArm64Url: string | null; rpmAmd64Url: string | null; wheelUrl: string | null; winInstallerUrl: string | null; winPortableUrl: string | null } | null}
 */
export function parseRelease(release) {
  if (!release) return null;

  const assets = release.assets ?? [];
  const appImageAmd64 = getAssetUrl(
    assets,
    (name) =>
      name.endsWith('.AppImage') &&
      /linux/i.test(name) &&
      /(amd64|x86_64)/i.test(name) &&
      !/(arm64|aarch64)/i.test(name)
  );
  const appImageArm64 = getAssetUrl(
    assets,
    (name) => name.endsWith('.AppImage') && /linux/i.test(name) && /(arm64|aarch64)/i.test(name)
  );
  const appImageFallback = getAssetUrl(
    assets,
    (name) =>
      name.endsWith('.AppImage') &&
      /linux/i.test(name) &&
      !/(amd64|x86_64|arm64|aarch64)/i.test(name)
  );
  const debAmd64 = getAssetUrl(assets, (name) => /\.deb$/i.test(name) && /(amd64|x86_64)/i.test(name));
  const debArm64 = getAssetUrl(assets, (name) => /\.deb$/i.test(name) && /(arm64|aarch64)/i.test(name));
  const rpmAmd64 = getAssetUrl(assets, (name) => /\.rpm$/i.test(name) && /(amd64|x86_64)/i.test(name));
  const wheel = assets.find((a) => a.name && a.name.endsWith('-py3-none-any.whl'));
  const winInstaller = assets.find((a) => a.name && /win.*installer\.exe$/i.test(a.name));
  const winPortable = assets.find((a) => a.name && /win.*portable\.exe$/i.test(a.name));

  return {
    version: release.tag_name?.replace(/^v/, '') ?? null,
    releaseUrl: release.html_url ?? null,
    publishedAt: release.published_at ?? null,
    isPrerelease: Boolean(release.prerelease),
    appImageAmd64Url: appImageAmd64 ?? appImageFallback,
    appImageArm64Url: appImageArm64,
    debAmd64Url: debAmd64,
    debArm64Url: debArm64,
    rpmAmd64Url: rpmAmd64,
    wheelUrl: wheel?.browser_download_url ?? null,
    winInstallerUrl: winInstaller?.browser_download_url ?? null,
    winPortableUrl: winPortable?.browser_download_url ?? null
  };
}
