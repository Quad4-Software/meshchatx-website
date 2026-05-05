(function () {
  "use strict";

  var MCX_DEFAULTS = {
    "theme.toggle_dark": "Switch to dark mode",
    "theme.toggle_light": "Switch to light mode",
    "theme.mobile_dark": "Dark mode",
    "theme.mobile_light": "Light mode",
    "showcase.tab0": "Home",
    "showcase.tab1": "Messages",
    "showcase.tab2": "Contacts",
    "showcase.tab3": "Calls",
    "showcase.tab4": "Interfaces",
    "showcase.tab5": "Map",
    "showcase.tab6": "Nomadnet",
    "showcase.tab7": "Visualizer",
    "showcase.tab8": "Utilities",
    "showcase.tab9": "Settings",
    "showcase.tab10": "Identity",
    "showcase.tab11": "About",
    "showcase.desktop_fmt": "Desktop - %s - Screenshot",
    "showcase.mobile_fmt": "Mobile - %s",
    "home.version_here": "MeshChatX v%s is here",
    "download.no_release": "No release information available.",
    "download.latest": "Latest",
    "download.stable": "stable",
    "download.prerelease": "pre-release",
    "download.channel_stable": "Stable",
    "download.channel_pre": "Pre-release",
    "download.fetch_error": "Failed to load download index",
    "download.github_fallback": "GitHub releases",
    "download.published_prefix": "published",
    "download.published_just_now": "published just now",
  };

  function mcxT(key) {
    var o = window.MCX_I18N || {};
    var k = key.indexOf("js.") === 0 ? key.slice(3) : key;
    if (Object.prototype.hasOwnProperty.call(o, k)) return o[k];
    if (Object.prototype.hasOwnProperty.call(MCX_DEFAULTS, k))
      return MCX_DEFAULTS[k];
    return key;
  }

  function formatPublishedAgo(publishedAt) {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    const now = new Date();
    if (Number.isNaN(date.getTime())) return null;
    const locale = document.documentElement.lang || "en";
    let pastSec = (now.getTime() - date.getTime()) / 1000;
    if (pastSec < 0) pastSec = 0;
    if (pastSec < 2) {
      return mcxT("download.published_just_now");
    }
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
    const sec = Math.round(pastSec);
    let n;
    let unit;
    if (sec < 60) {
      n = -sec;
      unit = "second";
    } else if (sec < 3600) {
      n = -Math.round(sec / 60);
      unit = "minute";
    } else if (sec < 86400) {
      n = -Math.round(sec / 3600);
      unit = "hour";
    } else if (sec < 2628000) {
      n = -Math.round(sec / 86400);
      unit = "day";
    } else if (sec < 31536000) {
      n = -Math.round(sec / 2628000);
      unit = "month";
    } else {
      n = -Math.round(sec / 31536000);
      unit = "year";
    }
    const agoPart = rtf.format(n, unit);
    return mcxT("download.published_prefix") + " " + agoPart;
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isDark() {
    return document.documentElement.classList.contains("dark");
  }

  function syncThemeColor() {
    var meta = document.getElementById("mcx-theme-color");
    if (!meta) return;
    meta.setAttribute("content", isDark() ? "#09090b" : "#ffffff");
  }

  function setThemeIcon(btn) {
    if (!btn) return;
    const use = btn.querySelector("use");
    if (!use) return;
    use.setAttribute(
      "href",
      isDark() ? "#i-weather-sunny" : "#i-weather-night",
    );
    btn.setAttribute(
      "aria-label",
      isDark() ? mcxT("theme.toggle_light") : mcxT("theme.toggle_dark"),
    );
  }

  function toggleDarkMode() {
    const root = document.documentElement;
    const wantDark = !(
      root.classList.contains("dark") ||
      (!root.classList.contains("light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
    root.classList.remove("dark", "light");
    if (wantDark) {
      root.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      root.classList.add("light");
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
    qsa("[data-theme-toggle]").forEach(setThemeIcon);
    const mobileLabel = qs("#mcx-mobile-theme-label");
    if (mobileLabel) {
      mobileLabel.textContent = isDark()
        ? mcxT("theme.mobile_light")
        : mcxT("theme.mobile_dark");
    }
    const mobileUse = qs("#mcx-mobile-theme-icon");
    if (mobileUse) {
      mobileUse.setAttribute(
        "href",
        isDark() ? "#i-weather-sunny" : "#i-weather-night",
      );
    }
    qsa("[data-mcx-showcase]").forEach(function (showcase) {
      var t = parseInt(showcase.dataset.activeTab, 10);
      if (!isNaN(t)) updateShowcaseImages(showcase, t);
    });
    syncThemeColor();
  }

  function initThemeToggle() {
    qsa("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggleDarkMode);
      setThemeIcon(btn);
    });
    const mobileLabel = qs("#mcx-mobile-theme-label");
    if (mobileLabel) {
      mobileLabel.textContent = isDark()
        ? mcxT("theme.mobile_light")
        : mcxT("theme.mobile_dark");
    }
    const mobileUse = qs("#mcx-mobile-theme-icon");
    if (mobileUse) {
      mobileUse.setAttribute(
        "href",
        isDark() ? "#i-weather-sunny" : "#i-weather-night",
      );
    }
    syncThemeColor();
  }

  function copyText(text, btn) {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () {
      if (!btn) return;
      const use = btn.querySelector("use");
      if (use) {
        const prev = use.getAttribute("href");
        use.setAttribute("href", "#i-check");
        setTimeout(function () {
          use.setAttribute("href", prev);
        }, 2000);
      }
    });
  }

  function initCopyButtons() {
    qsa("[data-copy]").forEach((btn) => {
      if (btn.getAttribute("data-mcx-copy-bound")) return;
      btn.setAttribute("data-mcx-copy-bound", "1");
      btn.addEventListener("click", function () {
        copyText(btn.getAttribute("data-copy"), btn);
      });
    });
  }

  var mcxDownloadInitSeq = 0;

  var MCX_SHOWCASE_TAB_FILES = [
    "tab-11-home.webp",
    "tab-0-messages.webp",
    "tab-1-contacts.webp",
    "tab-2-calls.webp",
    "tab-3-interfaces.webp",
    "tab-4-map.webp",
    "tab-5-nomadnet.webp",
    "tab-6-visualizer.webp",
    "tab-7-utilities.webp",
    "tab-8-settings.webp",
    "tab-9-identity.webp",
    "tab-10-about.webp",
  ];

  function getShowcaseMaxTab(root) {
    var max = 0;
    root.querySelectorAll("[data-showcase-tab]").forEach(function (btn) {
      var idx = parseInt(btn.getAttribute("data-showcase-tab"), 10);
      if (!isNaN(idx)) max = Math.max(max, idx);
    });
    return max;
  }

  function getShowcaseAssetBase(root) {
    var b = root.getAttribute("data-showcase-assets");
    if (!b) return "static/showcase/";
    return b;
  }

  function showcaseShotUrl(root, index) {
    var base = getShowcaseAssetBase(root);
    var sub = isDark() ? "dark/" : "light/";
    return base + sub + MCX_SHOWCASE_TAB_FILES[index];
  }

  function updateShowcaseImages(root, tabIndex) {
    root.querySelectorAll("[data-showcase-img]").forEach(function (img) {
      var frame = img.closest("[data-showcase-frame]");
      var ph = frame
        ? frame.querySelector("[data-showcase-placeholder]")
        : null;
      if (ph) ph.classList.add("hidden");
      img.classList.remove("hidden");
      img.src = showcaseShotUrl(root, tabIndex);
      img.alt = "";
    });
  }

  function setShowcaseTab(index, root) {
    var maxTab = getShowcaseMaxTab(root);
    var i = Math.max(0, Math.min(index, maxTab));
    var label = mcxT("showcase.tab" + i);
    root.querySelectorAll("[data-showcase-label]").forEach(function (el) {
      el.textContent = label;
    });
    root.querySelectorAll("[data-showcase-tab]").forEach(function (btn) {
      var idx = parseInt(btn.getAttribute("data-showcase-tab"), 10);
      btn.classList.toggle("is-active", idx === i);
    });
    root
      .querySelectorAll("[data-showcase-mobile-item]")
      .forEach(function (btn) {
        var idx = parseInt(btn.getAttribute("data-showcase-mobile-item"), 10);
        btn.classList.toggle("is-active", idx === i);
      });
    root.dataset.activeTab = String(i);
    updateShowcaseImages(root, i);
  }

  function resetShowcaseMenuIcons(root) {
    root
      .querySelectorAll("[data-showcase-menu] summary use")
      .forEach(function (use) {
        use.setAttribute("href", "#i-menu");
      });
  }

  function initShowcase(root) {
    let active = 0;

    setShowcaseTab(0, root);

    root.querySelectorAll("[data-showcase-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        active = parseInt(btn.getAttribute("data-showcase-tab"), 10);
        setShowcaseTab(active, root);
      });
    });

    root
      .querySelectorAll("[data-showcase-mobile-item]")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          active = parseInt(btn.getAttribute("data-showcase-mobile-item"), 10);
          setShowcaseTab(active, root);
          const det = btn.closest("[data-showcase-menu]");
          if (det) {
            det.open = false;
            resetShowcaseMenuIcons(root);
          }
        });
      });

    root.querySelectorAll("[data-showcase-screen]").forEach(function (el) {
      el.addEventListener("click", function () {
        root.querySelectorAll("[data-showcase-menu]").forEach(function (d) {
          d.open = false;
        });
        resetShowcaseMenuIcons(root);
      });
    });

    root.querySelectorAll("[data-showcase-menu]").forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) {
          root.querySelectorAll("[data-showcase-menu]").forEach(function (o) {
            if (o !== d) o.open = false;
          });
        }
        const use = d.querySelector("summary use");
        if (use) use.setAttribute("href", d.open ? "#i-close" : "#i-menu");
      });
    });
  }

  function initViewToggle(root) {
    const mobileEl = qs("[data-showcase-mobile]", root);
    const desktopEl = qs("[data-showcase-desktop]", root);
    if (root.getAttribute("data-showcase-desktop-only") === "true") {
      if (mobileEl) mobileEl.classList.add("hidden");
      if (desktopEl) desktopEl.classList.remove("hidden");
      return;
    }
    const mobileBtn = qs('[data-view="mobile"]', root);
    const desktopBtn = qs('[data-view="desktop"]', root);
    if (!mobileBtn || !desktopBtn) return;

    function setView(v) {
      const isMobile = v === "mobile";
      mobileBtn.classList.toggle("is-active", isMobile);
      desktopBtn.classList.toggle("is-active", !isMobile);
      if (mobileEl) mobileEl.classList.toggle("hidden", !isMobile);
      if (desktopEl) desktopEl.classList.toggle("hidden", isMobile);
    }

    mobileBtn.addEventListener("click", function () {
      setView("mobile");
    });
    desktopBtn.addEventListener("click", function () {
      setView("desktop");
    });

    const mq = window.matchMedia("(min-width: 768px)");
    setView(mq.matches ? "desktop" : "mobile");
  }

  function bindShowcaseRoot(root) {
    if (!root || root.getAttribute("data-mcx-showcase-bound") === "1") return;
    root.setAttribute("data-mcx-showcase-bound", "1");
    initViewToggle(root);
    initShowcase(root);
  }

  function initShowcaseRoots() {
    qsa("[data-mcx-showcase]").forEach(bindShowcaseRoot);
  }

  function releasesPayloadFromWindow() {
    var p = window.MCX_RELEASES_PAYLOAD;
    if (p && typeof p === "object") return p;
    return {
      stable: null,
      prerelease: null,
      githubFallbackUrl: "https://github.com/Quad4-Software/MeshChatX/releases",
    };
  }

  async function loadHomeVersion() {
    const badge = qs("[data-version-badge]");
    if (!badge) return;
    try {
      var p = releasesPayloadFromWindow();
      var v =
        (p.stable && p.stable.version) ||
        (p.prerelease && p.prerelease.version) ||
        null;
      if (!v) {
        badge.classList.add("hidden");
        return;
      }
      const span = badge.querySelector("[data-version-text]");
      if (span) span.textContent = mcxT("home.version_here").replace("%s", v);
      badge.classList.remove("hidden");
    } catch {
      badge.classList.add("hidden");
    }
  }

  const COMPOSE_YAML =
    "services:\n" +
    "    reticulum-meshchatx:\n" +
    "        container_name: reticulum-meshchatx\n" +
    "        image: ${MESHCHAT_IMAGE:-quad4io/meshchatx:latest}\n" +
    "        restart: unless-stopped\n" +
    "        security_opt:\n" +
    "            - no-new-privileges:true\n" +
    "        ports:\n" +
    "            - 127.0.0.1:8000:8000\n" +
    "        volumes:\n" +
    "            - meshchatx-config:/config\n" +
    "\n" +
    "volumes:\n" +
    "    meshchatx-config:\n" +
    "        name: meshchatx-config";

  function runCmd(engine) {
    return (
      engine +
      " run -d --name reticulum-meshchatx \\\n" +
      "  --restart unless-stopped \\\n" +
      "  --security-opt no-new-privileges:true \\\n" +
      "  -p 127.0.0.1:8000:8000 \\\n" +
      "  -v meshchatx-config:/config \\\n" +
      "  quad4io/meshchatx:latest"
    );
  }

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) e.textContent = html;
    return e;
  }

  function setDownloadPage(data) {
    const meta = qs("#mcx-download-meta");
    if (!meta) return;

    const sel = data.selectedRelease;
    const channel = data.selectedChannel || "stable";
    const err = data.error;

    meta.textContent = "";

    const sbomWrapEarly = qs("#mcx-sbom-wrap");
    if (sbomWrapEarly) sbomWrapEarly.classList.add("hidden");

    if (err) {
      meta.appendChild(el("span", { class: "mcx-muted" }, err));
      return;
    }

    if (!sel || !sel.version) {
      meta.appendChild(
        el("span", { class: "mcx-muted" }, mcxT("download.no_release")),
      );
      return;
    }

    const line = el("span", { class: "mcx-muted" });
    line.appendChild(
      document.createTextNode(
        mcxT("download.latest") +
          " " +
          (channel === "prerelease"
            ? mcxT("download.prerelease")
            : mcxT("download.stable")) +
          ": v" +
          sel.version +
          " ",
      ),
    );
    const pill = el("span", { class: "mcx-badge-pill" });
    pill.textContent =
      channel === "prerelease"
        ? mcxT("download.prerelease")
        : mcxT("download.stable");
    line.appendChild(pill);
    line.appendChild(document.createTextNode(" "));

    if (data.publishedAtRelative) {
      line.appendChild(document.createTextNode(" \u00b7 "));
      const rel = el("span", { class: "mcx-muted mcx-text-sm" });
      rel.textContent = data.publishedAtRelative;
      line.appendChild(rel);
    }

    if (data.hasPreRelease && data.hasStableRelease) {
      const wrap = el("span", { class: "mcx-channel-pill" });
      var loc =
        typeof window !== "undefined" && window.location
          ? window.location
          : null;
      var pathOnly =
        loc && loc.pathname
          ? loc.pathname
          : typeof window !== "undefined" &&
              window.location &&
              window.location.pathname
            ? window.location.pathname
            : "/download";
      var locHash = loc && loc.hash ? loc.hash : "";
      const aStable = el("a", { href: pathOnly + locHash });
      aStable.textContent = mcxT("download.channel_stable");
      if (channel === "stable") aStable.classList.add("is-active-stable");
      const aPre = el("a", {
        href: pathOnly + "?channel=prerelease" + locHash,
      });
      aPre.textContent = mcxT("download.channel_pre");
      if (channel === "prerelease") aPre.classList.add("is-active-pre");
      wrap.appendChild(aStable);
      wrap.appendChild(aPre);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(wrap);
    }

    meta.appendChild(line);

    const sbomWrap = qs("#mcx-sbom-wrap");
    const sbom = qs("#mcx-sbom-link");
    if (sbomWrap && sbom) {
      if (sel.sbomUrl) {
        sbom.href = sel.sbomUrl;
        sbomWrap.classList.remove("hidden");
      } else {
        sbomWrap.classList.add("hidden");
      }
    }

    function setHref(id, url) {
      const node = qs(id);
      if (!node) return;
      if (url) {
        node.setAttribute("href", url);
        node.classList.remove("hidden");
      } else {
        node.classList.add("hidden");
      }
    }

    function linuxOrPre(field) {
      var v = sel[field];
      if (v) return v;
      var pre = data.preRelease;
      return pre && pre[field] ? pre[field] : null;
    }

    const appAmd = linuxOrPre("appImageAmd64Url");
    const appArm = linuxOrPre("appImageArm64Url");
    const debA = linuxOrPre("debAmd64Url");
    const debR = linuxOrPre("debArm64Url");
    const rpmA = linuxOrPre("rpmAmd64Url");
    const flat = linuxOrPre("flatpakUrl");

    setHref("#mcx-dl-appimage-amd64", appAmd);
    setHref("#mcx-dl-appimage-arm64", appArm);
    setHref("#mcx-dl-deb-amd64", debA);
    setHref("#mcx-dl-deb-arm64", debR);
    setHref("#mcx-dl-rpm-amd64", rpmA);
    setHref("#mcx-dl-flatpak", flat);
    setHref("#mcx-dl-win-inst", sel.winInstallerUrl);
    setHref("#mcx-dl-win-port", sel.winPortableUrl);

    var macDmgUrl = sel.macDmgUrl;
    if (!macDmgUrl && data.preRelease && data.preRelease.macDmgUrl) {
      macDmgUrl = data.preRelease.macDmgUrl;
    }
    setHref("#mcx-dl-macos-dmg", macDmgUrl);

    setHref("#mcx-dl-apk", sel.apkUrl);
    const apkPending = qs("#mcx-android-apk-pending");
    if (apkPending) {
      apkPending.classList.toggle("hidden", !!sel.apkUrl);
    }

    const macPending = qs("#mcx-macos-pending");
    if (macPending) {
      macPending.classList.toggle("hidden", !!macDmgUrl);
    }

    const noApp = qs("#mcx-no-appimage");
    if (noApp) {
      noApp.classList.toggle("hidden", !!(appAmd || appArm));
    }
    const noDeb = qs("#mcx-no-deb");
    if (noDeb) {
      noDeb.classList.toggle("hidden", !!(debA || debR));
    }
    const noRpm = qs("#mcx-no-rpm");
    if (noRpm) {
      noRpm.classList.toggle("hidden", !!rpmA);
    }
    const noFlatpak = qs("#mcx-no-flatpak");
    if (noFlatpak) {
      noFlatpak.classList.toggle("hidden", !!flat);
    }
    const noWin = qs("#mcx-no-win");
    if (noWin) {
      noWin.classList.toggle(
        "hidden",
        !!(sel.winInstallerUrl || sel.winPortableUrl),
      );
    }

    const wheelUrl = sel.wheelUrl;
    const pyWheelWrap = qs("#mcx-python-wheel-wrap");
    if (pyWheelWrap) {
      if (wheelUrl) {
        pyWheelWrap.classList.remove("hidden");
        qsa("[data-wheel-cmd]", pyWheelWrap).forEach(function (node) {
          const kind = node.getAttribute("data-wheel-cmd");
          let cmd = "";
          if (kind === "pip") cmd = "pip install " + wheelUrl;
          else if (kind === "pipx") cmd = "pipx install " + wheelUrl;
          else if (kind === "poetry") cmd = "poetry add " + wheelUrl;
          else if (kind === "uv") cmd = "uv pip install " + wheelUrl;
          node.textContent = cmd;
          const wrap = node.closest(".mcx-code-row");
          const btn = wrap && wrap.querySelector("[data-copy]");
          if (btn) btn.setAttribute("data-copy", cmd);
        });
      } else {
        pyWheelWrap.classList.add("hidden");
      }
    }

    const termuxPipCmd = "pip install reticulum-meshchatx";
    const termuxPre = qs("#mcx-termux-pip");
    if (termuxPre) {
      termuxPre.textContent = termuxPipCmd;
      const btn = qs("#mcx-termux-pip-copy");
      if (btn) btn.setAttribute("data-copy", termuxPipCmd);
    }
  }

  async function initDownloadPage() {
    var seq = ++mcxDownloadInitSeq;
    const composePre = qs("#mcx-compose-yaml");
    if (composePre) composePre.textContent = COMPOSE_YAML;
    const composeBtn = qs("#mcx-compose-copy");
    if (composeBtn) composeBtn.setAttribute("data-copy", COMPOSE_YAML);

    const hubImg = "quad4io/meshchatx:latest";
    const ghcrImg = "ghcr.io/quad4-software/meshchatx:latest";
    const dockerPullHub = "docker pull " + hubImg;
    const dockerPullGhcr = "docker pull " + ghcrImg;
    const podmanPullHub = "podman pull " + hubImg;
    const podmanPullGhcr = "podman pull " + ghcrImg;
    const dph = qs("#mcx-docker-pull-hub-text");
    if (dph) dph.textContent = dockerPullHub;
    const dpg = qs("#mcx-docker-pull-ghcr-text");
    if (dpg) dpg.textContent = dockerPullGhcr;
    const pph = qs("#mcx-podman-pull-hub-text");
    if (pph) pph.textContent = podmanPullHub;
    const ppg = qs("#mcx-podman-pull-ghcr-text");
    if (ppg) ppg.textContent = podmanPullGhcr;
    const dphb = qs("#mcx-docker-pull-hub-copy");
    if (dphb) dphb.setAttribute("data-copy", dockerPullHub);
    const dpgb = qs("#mcx-docker-pull-ghcr-copy");
    if (dpgb) dpgb.setAttribute("data-copy", dockerPullGhcr);
    const pphb = qs("#mcx-podman-pull-hub-copy");
    if (pphb) pphb.setAttribute("data-copy", podmanPullHub);
    const ppgb = qs("#mcx-podman-pull-ghcr-copy");
    if (ppgb) ppgb.setAttribute("data-copy", podmanPullGhcr);

    const dr = qs("#mcx-docker-run");
    if (dr) dr.textContent = runCmd("docker");
    const drb = qs("#mcx-docker-run-copy");
    if (drb) drb.setAttribute("data-copy", runCmd("docker"));
    const pr = qs("#mcx-podman-run");
    if (pr) pr.textContent = runCmd("podman");
    const prb = qs("#mcx-podman-run-copy");
    if (prb) prb.setAttribute("data-copy", runCmd("podman"));

    let stableRelease = null;
    let preRelease = null;
    let selectedRelease = null;
    let selectedChannel = "stable";
    let error = null;
    let githubFallbackUrl =
      "https://github.com/Quad4-Software/MeshChatX/releases";

    let payload = releasesPayloadFromWindow();
    if (
      !(payload.stable && payload.stable.version) &&
      !(payload.prerelease && payload.prerelease.version)
    ) {
      try {
        const r = await fetch("/api/mcx-releases", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (
            j &&
            typeof j === "object" &&
            ((j.stable && j.stable.version) ||
              (j.prerelease && j.prerelease.version))
          ) {
            window.MCX_RELEASES_PAYLOAD = j;
            payload = j;
          }
        }
      } catch (_) {}
    }

    try {
      githubFallbackUrl = payload.githubFallbackUrl || githubFallbackUrl;
      stableRelease = payload.stable || null;
      preRelease = payload.prerelease || null;

      const params = new URLSearchParams(window.location.search);
      const wantsPrerelease = params.get("channel") === "prerelease";
      if (wantsPrerelease && preRelease) {
        selectedChannel = "prerelease";
        selectedRelease = preRelease;
      } else if (stableRelease) {
        selectedChannel = "stable";
        selectedRelease = stableRelease;
      } else if (preRelease) {
        selectedChannel = "prerelease";
        selectedRelease = preRelease;
      }
    } catch (e) {
      error = e && e.message ? e.message : mcxT("download.fetch_error");
    }

    if (seq !== mcxDownloadInitSeq) return;

    var publishedAtRelative = null;
    try {
      if (
        selectedRelease &&
        window.MCX &&
        typeof window.MCX.formatPublishedAgo === "function"
      ) {
        publishedAtRelative = window.MCX.formatPublishedAgo(
          selectedRelease.publishedAt,
        );
      }
    } catch (_) {}

    setDownloadPage({
      stableRelease,
      preRelease,
      selectedRelease,
      selectedChannel,
      hasStableRelease: Boolean(stableRelease),
      hasPreRelease: Boolean(preRelease),
      publishedAtRelative,
      error,
      githubFallbackUrl,
    });

    if (selectedRelease && !publishedAtRelative) {
      setTimeout(function () {
        if (seq !== mcxDownloadInitSeq) return;
        fetch("/api/mcx-releases", { cache: "no-store" })
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(function (j) {
            if (!j || typeof j !== "object") return;
            var release =
              selectedChannel === "prerelease"
                ? j.prerelease || null
                : j.stable || null;
            if (
              release &&
              release.publishedAt &&
              window.MCX &&
              typeof window.MCX.formatPublishedAgo === "function"
            ) {
              var relText = window.MCX.formatPublishedAgo(release.publishedAt);
              if (relText) {
                setDownloadPage({
                  stableRelease: stableRelease,
                  preRelease: preRelease,
                  selectedRelease: selectedRelease,
                  selectedChannel: selectedChannel,
                  hasStableRelease: Boolean(stableRelease),
                  hasPreRelease: Boolean(preRelease),
                  publishedAtRelative: relText,
                  error: error,
                  githubFallbackUrl: githubFallbackUrl,
                });
              }
            }
          })
          .catch(function () {});
      }, 1200);
    }

    initCopyButtons();
  }

  function boot() {
    initThemeToggle();
    initCopyButtons();

    initShowcaseRoots();

    if (document.body.getAttribute("data-page") === "home") {
      loadHomeVersion();
    }
  }

  window.MCX = window.MCX || {};
  window.MCX.formatPublishedAgo = formatPublishedAgo;
  window.MCX.initDownloadPage = initDownloadPage;
  window.MCX.initShowcaseRoots = initShowcaseRoots;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
