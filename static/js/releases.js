(function () {
  "use strict";

  var GITEA_DL_BASE =
    "https://git.quad4.io/RNS-Things/MeshChatX/releases/download";
  var GITHUB_DL_BASE =
    "https://github.com/Quad4-Software/MeshChatX/releases/download";

  function downloadBaseForRelease(release) {
    if (!release) return GITEA_DL_BASE;
    var u = String(release.html_url || "");
    if (/github\.com/i.test(u)) return GITHUB_DL_BASE;
    return GITEA_DL_BASE;
  }

  function attachmentUrl(a) {
    if (!a) return null;
    var u = a.browser_download_url || a.download_url;
    return u && String(u).trim() ? u : null;
  }

  function buildReleaseAssetUrl(release, filename) {
    if (!release || !release.tag_name || !filename) return null;
    var base = downloadBaseForRelease(release);
    return (
      base +
      "/" +
      encodeURIComponent(release.tag_name) +
      "/" +
      encodeURIComponent(filename)
    );
  }

  function guessMacDmgFilenameFromWheel(assets) {
    var wheel = assets.find(function (a) {
      return a.name && a.name.endsWith("-py3-none-any.whl");
    });
    if (!wheel || !wheel.name) return null;
    var m = wheel.name.match(
      /^reticulum_meshchatx-([\d.]+)-py3-none-any\.whl$/i,
    );
    if (!m) return null;
    return "ReticulumMeshChatX-v" + m[1] + "-mac-universal.dmg";
  }

  function guessMacDmgFilenameFromTag(release) {
    if (!release || !release.tag_name) return null;
    var rest = String(release.tag_name).replace(/^v/i, "");
    var m = rest.match(/^(\d+\.\d+\.\d+)/);
    if (!m) return null;
    return "ReticulumMeshChatX-v" + m[1] + "-mac-universal.dmg";
  }

  function isLikelyPrereleaseRelease(release) {
    if (!release) return false;
    if (/-(rc|alpha|beta|pre)/i.test(String(release.tag_name || "")))
      return true;
    if (release.prerelease === true) return true;
    if (release.prerelease === false) return false;
    return false;
  }

  function macDmgUrlFromRelease(release, assets) {
    var macDmg = assets.find(function (a) {
      return (
        a.name && /\.dmg$/i.test(a.name) && !/\.dmg\.sha256$/i.test(a.name)
      );
    });
    if (macDmg) {
      var direct = attachmentUrl(macDmg);
      if (direct) return direct;
      return buildReleaseAssetUrl(release, macDmg.name);
    }
    if (!isLikelyPrereleaseRelease(release)) return null;
    var guessedName = guessMacDmgFilenameFromWheel(assets);
    if (guessedName) return buildReleaseAssetUrl(release, guessedName);
    guessedName = guessMacDmgFilenameFromTag(release);
    if (guessedName) return buildReleaseAssetUrl(release, guessedName);
    return null;
  }

  function collectAssets(release) {
    const a = release.assets;
    const b = release.attachments;
    if (Array.isArray(a) && a.length > 0) return a;
    if (Array.isArray(b) && b.length > 0) return b;
    return Array.isArray(a) ? a : [];
  }

  function getAssetUrl(assets, matcher) {
    const asset = assets.find((a) => a.name && matcher(a.name));
    return attachmentUrl(asset);
  }

  function parseRelease(release) {
    if (!release) return null;

    const assets = collectAssets(release);
    const appImageAmd64 = getAssetUrl(
      assets,
      (name) =>
        name.endsWith(".AppImage") &&
        /linux/i.test(name) &&
        /(amd64|x86_64)/i.test(name) &&
        !/(arm64|aarch64)/i.test(name),
    );
    const appImageArm64 = getAssetUrl(
      assets,
      (name) =>
        name.endsWith(".AppImage") &&
        /linux/i.test(name) &&
        /(arm64|aarch64)/i.test(name),
    );
    const appImageFallback = getAssetUrl(
      assets,
      (name) =>
        name.endsWith(".AppImage") &&
        /linux/i.test(name) &&
        !/(amd64|x86_64|arm64|aarch64)/i.test(name),
    );
    const debAmd64 = getAssetUrl(
      assets,
      (name) => /\.deb$/i.test(name) && /(amd64|x86_64)/i.test(name),
    );
    const debArm64 = getAssetUrl(
      assets,
      (name) => /\.deb$/i.test(name) && /(arm64|aarch64)/i.test(name),
    );
    const rpmAmd64 = getAssetUrl(
      assets,
      (name) => /\.rpm$/i.test(name) && /(amd64|x86_64)/i.test(name),
    );
    const wheel = assets.find(
      (a) => a.name && a.name.endsWith("-py3-none-any.whl"),
    );
    const winInstaller = assets.find(
      (a) => a.name && /win.*installer\.exe$/i.test(a.name),
    );
    const winPortable = assets.find(
      (a) => a.name && /win.*portable\.exe$/i.test(a.name),
    );
    const apk = getAssetUrl(assets, (name) => /\.apk$/i.test(name));
    const flatpak = getAssetUrl(assets, (name) => /\.flatpak$/i.test(name));
    const sbom = getAssetUrl(assets, (name) =>
      /sbom\.cyclonedx\.json$/i.test(name),
    );
    return {
      version: release.tag_name?.replace(/^v/, "") ?? null,
      releaseUrl: release.html_url ?? null,
      publishedAt: release.published_at ?? null,
      isPrerelease: Boolean(release.prerelease),
      appImageAmd64Url: appImageAmd64 ?? appImageFallback,
      appImageArm64Url: appImageArm64,
      debAmd64Url: debAmd64,
      debArm64Url: debArm64,
      rpmAmd64Url: rpmAmd64,
      wheelUrl: attachmentUrl(wheel),
      winInstallerUrl: attachmentUrl(winInstaller),
      winPortableUrl: attachmentUrl(winPortable),
      macDmgUrl: macDmgUrlFromRelease(release, assets),
      apkUrl: apk,
      flatpakUrl: flatpak,
      sbomUrl: sbom,
    };
  }

  function formatRelativeTime(publishedAt) {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    const now = new Date();
    const locale = document.documentElement.lang || "en";
    const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
    const diffHour = Math.round(diffSec / 3600);
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
    const diffDay = Math.round(diffSec / 86400);
    if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
    const diffWeek = Math.round(diffSec / 604800);
    if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week");
    const diffMonth = Math.round(diffSec / 2628000);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
    const diffYear = Math.round(diffSec / 31536000);
    return rtf.format(diffYear, "year");
  }

  window.MCX = {
    isLikelyPrereleaseRelease: isLikelyPrereleaseRelease,
    parseRelease,
    formatRelativeTime,
  };
})();
