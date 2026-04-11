(function () {
  'use strict';

  function getAssetUrl(assets, matcher) {
    const asset = assets.find((a) => a.name && matcher(a.name));
    return asset?.browser_download_url ?? null;
  }

  function parseRelease(release) {
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

  function formatRelativeTime(publishedAt) {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    const now = new Date();
    const locale = document.documentElement.lang || 'en';
    const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    const diffHour = Math.round(diffSec / 3600);
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    const diffDay = Math.round(diffSec / 86400);
    if (Math.abs(diffDay) < 7) return rtf.format(diffDay, 'day');
    const diffWeek = Math.round(diffSec / 604800);
    if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, 'week');
    const diffMonth = Math.round(diffSec / 2628000);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    const diffYear = Math.round(diffSec / 31536000);
    return rtf.format(diffYear, 'year');
  }

  window.MCX = {
    GITEA_RELEASES: 'https://git.meshchatx.com/api/v1/repos/RNS-Things/MeshChatX/releases?limit=25',
    parseRelease,
    formatRelativeTime
  };
})();
