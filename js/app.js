(function () {
  'use strict';

  var MCX_DEFAULTS = {
    'theme.toggle_dark': 'Switch to dark mode',
    'theme.toggle_light': 'Switch to light mode',
    'theme.mobile_dark': 'Dark mode',
    'theme.mobile_light': 'Light mode',
    'showcase.tab0': 'Home',
    'showcase.tab1': 'Calls',
    'showcase.tab2': 'Messages',
    'showcase.tab3': 'Browser',
    'showcase.tab4': 'Archives',
    'showcase.tab5': 'Visualizer',
    'showcase.tab6': 'Tools',
    'showcase.desktop_fmt': 'Desktop — %s — Screenshot',
    'showcase.mobile_fmt': 'Mobile — %s',
    'home.version_here': 'MeshChatX v%s is here',
    'download.no_release': 'No release information available.',
    'download.latest': 'Latest',
    'download.stable': 'stable',
    'download.prerelease': 'pre-release',
    'download.all_releases': 'All releases',
    'download.channel_stable': 'Stable',
    'download.channel_pre': 'Pre-release',
    'download.fetch_error': 'Failed to fetch releases',
    'download.gitea_error': 'Gitea API '
  };

  function mcxT(key) {
    var o = window.MCX_I18N || {};
    var k = key.indexOf('js.') === 0 ? key.slice(3) : key;
    if (Object.prototype.hasOwnProperty.call(o, k)) return o[k];
    if (Object.prototype.hasOwnProperty.call(MCX_DEFAULTS, k)) return MCX_DEFAULTS[k];
    return key;
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function setThemeIcon(btn) {
    if (!btn) return;
    const use = btn.querySelector('use');
    if (!use) return;
    use.setAttribute('href', isDark() ? '#i-weather-sunny' : '#i-weather-night');
    btn.setAttribute(
      'aria-label',
      isDark() ? mcxT('theme.toggle_light') : mcxT('theme.toggle_dark')
    );
  }

  function toggleDarkMode() {
    const root = document.documentElement;
    const wantDark = !(
      root.classList.contains('dark') ||
      (!root.classList.contains('light') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
    root.classList.remove('dark', 'light');
    if (wantDark) {
      root.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (_) {}
    } else {
      root.classList.add('light');
      try {
        localStorage.setItem('theme', 'light');
      } catch (_) {}
    }
    qsa('[data-theme-toggle]').forEach(setThemeIcon);
    const mobileLabel = qs('#mcx-mobile-theme-label');
    if (mobileLabel) {
      mobileLabel.textContent = isDark() ? mcxT('theme.mobile_light') : mcxT('theme.mobile_dark');
    }
    const mobileUse = qs('#mcx-mobile-theme-icon');
    if (mobileUse) {
      mobileUse.setAttribute('href', isDark() ? '#i-weather-sunny' : '#i-weather-night');
    }
  }

  function initThemeToggle() {
    qsa('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleDarkMode);
      setThemeIcon(btn);
    });
    const mobileLabel = qs('#mcx-mobile-theme-label');
    if (mobileLabel) {
      mobileLabel.textContent = isDark() ? mcxT('theme.mobile_light') : mcxT('theme.mobile_dark');
    }
    const mobileUse = qs('#mcx-mobile-theme-icon');
    if (mobileUse) {
      mobileUse.setAttribute('href', isDark() ? '#i-weather-sunny' : '#i-weather-night');
    }
  }

  function copyText(text, btn) {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () {
      if (!btn) return;
      const use = btn.querySelector('use');
      if (use) {
        const prev = use.getAttribute('href');
        use.setAttribute('href', '#i-check');
        setTimeout(function () {
          use.setAttribute('href', prev);
        }, 2000);
      }
    });
  }

  function initCopyButtons() {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy'), btn);
      });
    });
  }

  function setShowcaseTab(index, root) {
    const maxTab = 6;
    const i = Math.max(0, Math.min(index, maxTab));
    const label = mcxT('showcase.tab' + i);
    root.querySelectorAll('[data-showcase-label]').forEach(function (el) {
      el.textContent = label;
    });
    root.querySelectorAll('[data-showcase-tab]').forEach(function (btn) {
      const idx = parseInt(btn.getAttribute('data-showcase-tab'), 10);
      btn.classList.toggle('is-active', idx === i);
    });
    root.querySelectorAll('[data-showcase-mobile-item]').forEach(function (btn) {
      const idx = parseInt(btn.getAttribute('data-showcase-mobile-item'), 10);
      btn.classList.toggle('is-active', idx === i);
    });
    root.querySelectorAll('[data-showcase-desktop-label]').forEach(function (el) {
      el.textContent = mcxT('showcase.desktop_fmt').replace('%s', label);
    });
    root.querySelectorAll('[data-showcase-mobile-label]').forEach(function (el) {
      el.textContent = mcxT('showcase.mobile_fmt').replace('%s', label);
    });
    root.dataset.activeTab = String(i);
  }

  function resetShowcaseMenuIcons(root) {
    root.querySelectorAll('[data-showcase-menu] summary use').forEach(function (use) {
      use.setAttribute('href', '#i-menu');
    });
  }

  function initShowcase(root) {
    let active = 0;

    setShowcaseTab(0, root);

    root.querySelectorAll('[data-showcase-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        active = parseInt(btn.getAttribute('data-showcase-tab'), 10);
        setShowcaseTab(active, root);
      });
    });

    root.querySelectorAll('[data-showcase-mobile-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        active = parseInt(btn.getAttribute('data-showcase-mobile-item'), 10);
        setShowcaseTab(active, root);
        const det = btn.closest('[data-showcase-menu]');
        if (det) {
          det.open = false;
          resetShowcaseMenuIcons(root);
        }
      });
    });

    root.querySelectorAll('[data-showcase-screen]').forEach(function (el) {
      el.addEventListener('click', function () {
        root.querySelectorAll('[data-showcase-menu]').forEach(function (d) {
          d.open = false;
        });
        resetShowcaseMenuIcons(root);
      });
    });

    root.querySelectorAll('[data-showcase-menu]').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          root.querySelectorAll('[data-showcase-menu]').forEach(function (o) {
            if (o !== d) o.open = false;
          });
        }
        const use = d.querySelector('summary use');
        if (use) use.setAttribute('href', d.open ? '#i-close' : '#i-menu');
      });
    });
  }

  function initViewToggle(root) {
    const mobileBtn = qs('[data-view="mobile"]', root);
    const desktopBtn = qs('[data-view="desktop"]', root);
    const mobileEl = qs('[data-showcase-mobile]', root);
    const desktopEl = qs('[data-showcase-desktop]', root);
    if (!mobileBtn || !desktopBtn) return;

    function setView(v) {
      const isMobile = v === 'mobile';
      mobileBtn.classList.toggle('is-active', isMobile);
      desktopBtn.classList.toggle('is-active', !isMobile);
      if (mobileEl) mobileEl.classList.toggle('hidden', !isMobile);
      if (desktopEl) desktopEl.classList.toggle('hidden', isMobile);
    }

    mobileBtn.addEventListener('click', function () {
      setView('mobile');
    });
    desktopBtn.addEventListener('click', function () {
      setView('desktop');
    });

    const mq = window.matchMedia('(min-width: 768px)');
    setView(mq.matches ? 'desktop' : 'mobile');
  }

  async function fetchReleasesJson() {
    const res = await fetch(window.MCX.GITEA_RELEASES, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(mcxT('download.gitea_error') + res.status);
    return res.json();
  }

  async function loadHomeVersion() {
    const badge = qs('[data-version-badge]');
    if (!badge) return;
    try {
      const releases = await fetchReleasesJson();
      const list = Array.isArray(releases) ? releases : [];
      const published = list.filter(function (r) {
        return !r.draft;
      });
      const rel = published.find(function (r) {
        return !r.prerelease;
      }) || published[0];
      const v = rel && rel.tag_name ? String(rel.tag_name).replace(/^v/, '') : null;
      if (!v) {
        badge.classList.add('hidden');
        return;
      }
      const span = badge.querySelector('[data-version-text]');
      if (span) span.textContent = mcxT('home.version_here').replace('%s', v);
      badge.classList.remove('hidden');
    } catch (_) {
      badge.classList.add('hidden');
    }
  }

  function setPlatformClasses(platforms) {
    const map = {
      macos: '[data-plat="macos"]',
      linux: '[data-plat="linux"]',
      windows: '[data-plat="windows"]',
      docker: '[data-plat="docker"]',
      python: '[data-plat="python"]',
      termux: '[data-plat="termux"]'
    };
    Object.keys(map).forEach(function (key) {
      const el = qs(map[key]);
      if (!el) return;
      if (platforms[key]) el.classList.remove('mcx-disabled');
      else el.classList.add('mcx-disabled');
    });
  }

  async function loadHomePlatforms() {
    try {
      const releases = await fetchReleasesJson();
      const list = Array.isArray(releases) ? releases : [];
      const published = list.filter(function (r) {
        return !r.draft;
      });
      const rel = published.find(function (r) {
        return !r.prerelease;
      }) || published[0];
      if (!rel) return;
      const assets = rel.assets || [];
      const hasAppImage = assets.some(function (a) {
        return a.name && a.name.endsWith('.AppImage') && /linux/i.test(a.name);
      });
      const hasWheel = assets.some(function (a) {
        return a.name && a.name.endsWith('-py3-none-any.whl');
      });
      const hasWin = assets.some(function (a) {
        return (
          a.name &&
          (/win.*installer\.exe$/i.test(a.name) || /win.*portable\.exe$/i.test(a.name))
        );
      });
      setPlatformClasses({
        macos: false,
        linux: !!hasAppImage,
        windows: !!hasWin,
        docker: true,
        python: !!hasWheel,
        termux: !!hasWheel
      });
    } catch (_) {}
  }

  const COMPOSE_YAML =
    'services:\n' +
    '    reticulum-meshchatx:\n' +
    '        container_name: reticulum-meshchatx\n' +
    '        image: ${MESHCHAT_IMAGE:-git.meshchatx.com/rns-things/meshchatx:latest}\n' +
    '        restart: unless-stopped\n' +
    '        security_opt:\n' +
    '            - no-new-privileges:true\n' +
    '        ports:\n' +
    '            - 127.0.0.1:8000:8000\n' +
    '        volumes:\n' +
    '            - ./meshchat-config:/config';

  function runCmd(engine) {
    return (
      engine +
      ' run -d \\\n' +
      '  --name reticulum-meshchatx \\\n' +
      '  --restart unless-stopped \\\n' +
      '  --security-opt no-new-privileges:true \\\n' +
      '  -p 127.0.0.1:8000:8000 \\\n' +
      '  -v ./meshchat-config:/config \\\n' +
      '  git.meshchatx.com/rns-things/meshchatx:latest'
    );
  }

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) e.textContent = html;
    return e;
  }

  function setDownloadPage(data) {
    const meta = qs('#mcx-download-meta');
    if (!meta) return;

    const sel = data.selectedRelease;
    const channel = data.selectedChannel || 'stable';
    const err = data.error;

    meta.textContent = '';

    if (err) {
      meta.appendChild(el('span', { class: 'mcx-muted' }, err));
      return;
    }

    if (!sel || !sel.version) {
      meta.appendChild(
        el('span', { class: 'mcx-muted' }, mcxT('download.no_release'))
      );
      return;
    }

    const line = el('span', { class: 'mcx-muted' });
    line.appendChild(
      document.createTextNode(
        mcxT('download.latest') +
          ' ' +
          (channel === 'prerelease' ? mcxT('download.prerelease') : mcxT('download.stable')) +
          ': v' +
          sel.version +
          ' '
      )
    );
    const pill = el('span', { class: 'mcx-badge-pill' });
    pill.textContent = channel === 'prerelease' ? mcxT('download.prerelease') : mcxT('download.stable');
    line.appendChild(pill);
    line.appendChild(document.createTextNode(' '));

    if (sel.releaseUrl) {
      const a = el('a', {
        href: sel.releaseUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'mcx-link-blue'
      });
      a.textContent = mcxT('download.all_releases');
      line.appendChild(a);
      line.appendChild(document.createTextNode(' '));
    }

    if (data.publishedAtRelative) {
      const rel = el('span', { class: 'mcx-rel-emerald mcx-text-sm' });
      rel.textContent = data.publishedAtRelative;
      line.appendChild(rel);
    }

    if (data.hasPreRelease) {
      const wrap = el('span', { class: 'mcx-channel-pill' });
      const aStable = el('a', { href: 'download.html' });
      aStable.textContent = mcxT('download.channel_stable');
      if (channel === 'stable') aStable.classList.add('is-active-stable');
      const aPre = el('a', { href: 'download.html?channel=prerelease' });
      aPre.textContent = mcxT('download.channel_pre');
      if (channel === 'prerelease') aPre.classList.add('is-active-pre');
      wrap.appendChild(aStable);
      wrap.appendChild(aPre);
      line.appendChild(document.createTextNode(' '));
      line.appendChild(wrap);
    }

    meta.appendChild(line);

    const sbom = qs('#mcx-sbom-link');
    if (sbom) {
      sbom.href =
        'https://git.meshchatx.com/RNS-Things/MeshChatX/releases/download/v' +
        sel.version +
        '/sbom.cyclonedx.json';
      sbom.classList.remove('hidden');
    }

    function setHref(id, url) {
      const node = qs(id);
      if (!node) return;
      if (url) {
        node.setAttribute('href', url);
        node.classList.remove('hidden');
      } else {
        node.classList.add('hidden');
      }
    }

    setHref('#mcx-dl-appimage-amd64', sel.appImageAmd64Url);
    setHref('#mcx-dl-appimage-arm64', sel.appImageArm64Url);
    setHref('#mcx-dl-deb-amd64', sel.debAmd64Url);
    setHref('#mcx-dl-deb-arm64', sel.debArm64Url);
    setHref('#mcx-dl-rpm-amd64', sel.rpmAmd64Url);
    setHref('#mcx-dl-win-inst', sel.winInstallerUrl);
    setHref('#mcx-dl-win-port', sel.winPortableUrl);

    const noApp = qs('#mcx-no-appimage');
    if (noApp) {
      noApp.classList.toggle('hidden', !!(sel.appImageAmd64Url || sel.appImageArm64Url));
    }
    const noDeb = qs('#mcx-no-deb');
    if (noDeb) {
      noDeb.classList.toggle('hidden', !!(sel.debAmd64Url || sel.debArm64Url));
    }
    const noRpm = qs('#mcx-no-rpm');
    if (noRpm) {
      noRpm.classList.toggle('hidden', !!sel.rpmAmd64Url);
    }
    const noWin = qs('#mcx-no-win');
    if (noWin) {
      noWin.classList.toggle('hidden', !!(sel.winInstallerUrl || sel.winPortableUrl));
    }

    const wheelUrl = sel.wheelUrl;
    const pyBlock = qs('#mcx-python-block');
    const pyEmpty = qs('#mcx-python-empty');
    if (pyBlock && pyEmpty) {
      if (wheelUrl) {
        pyBlock.classList.remove('hidden');
        pyEmpty.classList.add('hidden');
        qsa('[data-wheel-cmd]', pyBlock).forEach(function (node) {
          const kind = node.getAttribute('data-wheel-cmd');
          let cmd = '';
          if (kind === 'pip') cmd = 'pip install ' + wheelUrl;
          else if (kind === 'pipx') cmd = 'pipx install ' + wheelUrl;
          else if (kind === 'poetry') cmd = 'poetry add ' + wheelUrl;
          else if (kind === 'uv') cmd = 'uv pip install ' + wheelUrl;
          node.textContent = cmd;
          const wrap = node.closest('.mcx-code-row');
          const btn = wrap && wrap.querySelector('[data-copy]');
          if (btn) btn.setAttribute('data-copy', cmd);
        });
      } else {
        pyBlock.classList.add('hidden');
        pyEmpty.classList.remove('hidden');
      }
    }

    const termuxUrl =
      'pip install https://git.meshchatx.com/RNS-Things/MeshChatX/releases/download/v' +
      sel.version +
      '/reticulum_meshchatx-' +
      sel.version +
      '-py3-none-any.whl';
    const termuxPre = qs('#mcx-termux-pip');
    if (termuxPre) {
      termuxPre.textContent = termuxUrl;
      const btn = qs('#mcx-termux-pip-copy');
      if (btn) btn.setAttribute('data-copy', termuxUrl);
    }
  }

  async function initDownloadPage() {
    const composePre = qs('#mcx-compose-yaml');
    if (composePre) composePre.textContent = COMPOSE_YAML;
    const composeBtn = qs('#mcx-compose-copy');
    if (composeBtn) composeBtn.setAttribute('data-copy', COMPOSE_YAML);

    const dockerPull = 'docker pull git.meshchatx.com/rns-things/meshchatx:latest';
    const podmanPull = 'podman pull git.meshchatx.com/rns-things/meshchatx:latest';
    const dp = qs('#mcx-docker-pull-text');
    if (dp) dp.textContent = dockerPull;
    const pp = qs('#mcx-podman-pull-text');
    if (pp) pp.textContent = podmanPull;
    const dpb = qs('#mcx-docker-pull-copy');
    if (dpb) dpb.setAttribute('data-copy', dockerPull);
    const ppb = qs('#mcx-podman-pull-copy');
    if (ppb) ppb.setAttribute('data-copy', podmanPull);

    const dr = qs('#mcx-docker-run');
    if (dr) dr.textContent = runCmd('docker');
    const drb = qs('#mcx-docker-run-copy');
    if (drb) drb.setAttribute('data-copy', runCmd('docker'));
    const pr = qs('#mcx-podman-run');
    if (pr) pr.textContent = runCmd('podman');
    const prb = qs('#mcx-podman-run-copy');
    if (prb) prb.setAttribute('data-copy', runCmd('podman'));

    let stableRelease = null;
    let preRelease = null;
    let selectedRelease = null;
    let selectedChannel = 'stable';
    let error = null;

    try {
      const releases = await fetchReleasesJson();
      const releaseList = Array.isArray(releases) ? releases : [];
      const publishedReleases = releaseList.filter(function (r) {
        return !r.draft;
      });
      const latestStable = publishedReleases.find(function (r) {
        return !r.prerelease;
      });
      const latestPrerelease = publishedReleases.find(function (r) {
        return r.prerelease;
      });
      stableRelease = window.MCX.parseRelease(latestStable);
      preRelease = window.MCX.parseRelease(latestPrerelease);

      const params = new URLSearchParams(window.location.search);
      const wantsPrerelease = params.get('channel') === 'prerelease';
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
    } catch (e) {
      error = e && e.message ? e.message : mcxT('download.fetch_error');
    }

    const publishedAtRelative = selectedRelease
      ? window.MCX.formatRelativeTime(selectedRelease.publishedAt)
      : null;

    setDownloadPage({
      stableRelease,
      preRelease,
      selectedRelease,
      selectedChannel,
      hasStableRelease: Boolean(stableRelease),
      hasPreRelease: Boolean(preRelease),
      publishedAtRelative,
      error
    });

    initCopyButtons();
  }

  function boot() {
    initThemeToggle();
    initCopyButtons();

    const showcase = qs('[data-mcx-showcase]');
    if (showcase) {
      initViewToggle(showcase);
      initShowcase(showcase);
    }

    if (document.body.getAttribute('data-page') === 'home') {
      loadHomeVersion();
      loadHomePlatforms();
    }

    if (document.body.getAttribute('data-page') === 'download') {
      initDownloadPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
