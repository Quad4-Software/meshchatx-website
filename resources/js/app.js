import '@fontsource-variable/outfit/wght.css';
import Fuse from './vendor/fuse.mjs';

const THEME_KEY = 'theme';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DESKTOP_NAV = '(min-width: 1024px)';
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

let setMobileNavOpen = () => {};

function compactUri(value) {
    return String(value || '').replace(/[\u0000-\u0020\u007F]+/g, '');
}

function isDangerousUri(value) {
    return /^(javascript|data|vbscript):/i.test(compactUri(value));
}

function isSafeHttpUrl(value, { allowRelative = true } = {}) {
    const raw = String(value || '').trim();
    if (raw === '' || isDangerousUri(raw)) {
        return false;
    }
    try {
        const url = new URL(raw, window.location.origin);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return true;
        }
        if (allowRelative && (raw.startsWith('/') || raw.startsWith('#'))) {
            return url.origin === window.location.origin;
        }
        return false;
    } catch {
        return false;
    }
}

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch {
        return null;
    }
}

function setStoredTheme(value) {
    try {
        localStorage.setItem(THEME_KEY, value);
    } catch {
        // ignore
    }
}

function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(preference) {
    if (preference === 'dark' || preference === 'light') {
        return preference;
    }
    return systemPrefersDark() ? 'dark' : 'light';
}

function applyTheme(preference) {
    const pref = preference || getStoredTheme() || 'system';
    const resolved = resolveTheme(pref);
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    root.dataset.theme = pref;
    root.style.colorScheme = resolved;

    const meta = document.getElementById('mcx-theme-color');
    if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#fafafa');
    }

    document.querySelectorAll('[data-theme-picker]').forEach((picker) => {
        picker.dataset.themeState = resolved;
        picker.dataset.themePreference = pref;
        picker.querySelectorAll('[data-theme-option]').forEach((option) => {
            const active = option.getAttribute('data-theme-option') === pref;
            option.classList.toggle('is-active', active);
            option.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    });
}

function closeThemePickers() {
    document.querySelectorAll('[data-theme-picker].is-open').forEach((root) => {
        root.classList.remove('is-open');
        root.querySelector('[data-theme-trigger]')?.setAttribute('aria-expanded', 'false');
    });
}

function initTheme() {
    const preference = getStoredTheme() || 'system';
    applyTheme(preference);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', () => {
        const current = getStoredTheme() || 'system';
        if (current === 'system') {
            applyTheme('system');
        }
    });

    document.querySelectorAll('[data-theme-picker]').forEach((root) => {
        const trigger = root.querySelector('[data-theme-trigger]');
        if (!trigger) {
            return;
        }

        trigger.addEventListener('click', () => {
            const open = !root.classList.contains('is-open');
            closeLangPickers();
            document.querySelectorAll('[data-theme-picker].is-open').forEach((other) => {
                if (other !== root) {
                    other.classList.remove('is-open');
                    other
                        .querySelector('[data-theme-trigger]')
                        ?.setAttribute('aria-expanded', 'false');
                }
            });
            if (open) {
                setMobileNavOpen(false);
            }
            root.classList.toggle('is-open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        root.querySelectorAll('[data-theme-option]').forEach((option) => {
            option.addEventListener('click', () => {
                const next = option.getAttribute('data-theme-option') || 'system';
                setStoredTheme(next);
                applyTheme(next);
                closeThemePickers();
            });
        });
    });

    document.addEventListener('click', (event) => {
        document.querySelectorAll('[data-theme-picker].is-open').forEach((root) => {
            if (!root.contains(event.target)) {
                root.classList.remove('is-open');
                root.querySelector('[data-theme-trigger]')?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function closeLangPickers() {
    document.querySelectorAll('[data-lang-picker].is-open').forEach((root) => {
        root.classList.remove('is-open');
        root.querySelector('[data-lang-trigger]')?.setAttribute('aria-expanded', 'false');
    });
}

function syncHeaderHeight() {
    const header = document.querySelector('[data-site-header]');
    if (!header) {
        return;
    }

    const height = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--site-header-height', `${height}px`);
}

function lockPageScroll(lock) {
    const root = document.documentElement;
    if (lock) {
        const gap = window.innerWidth - root.clientWidth;
        root.style.paddingRight = gap > 0 ? `${gap}px` : '';
    } else {
        root.style.paddingRight = '';
    }

    root.classList.toggle('nav-open', lock);
    document.body.classList.toggle('nav-open', lock);
}

function setPageInert(lock) {
    document.querySelectorAll('main, .site-footer').forEach((node) => {
        if (lock) {
            node.setAttribute('inert', '');
        } else {
            node.removeAttribute('inert');
        }
    });
}

function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const nav = document.querySelector('[data-mobile-nav]');
    const scrim = document.querySelector('[data-nav-scrim]');
    if (!toggle || !nav) {
        return;
    }

    const desktopNav = window.matchMedia(DESKTOP_NAV);
    const labelOpen = toggle.getAttribute('data-label-open') || 'Open menu';
    const labelClose = toggle.getAttribute('data-label-close') || 'Close menu';

    const setOpen = (open) => {
        if (desktopNav.matches) {
            open = false;
        }

        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? labelClose : labelOpen);
        nav.classList.toggle('is-open', open);
        nav.setAttribute('aria-hidden', open ? 'false' : 'true');
        scrim?.setAttribute('aria-hidden', open ? 'false' : 'true');
        lockPageScroll(open);
        setPageInert(open);

        if (open) {
            closeLangPickers();
            closeThemePickers();
            syncHeaderHeight();
        }
    };

    setMobileNavOpen = setOpen;

    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        setOpen(open);
    });

    scrim?.addEventListener('click', () => setOpen(false));

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            closeLangPickers();
            closeThemePickers();
            return;
        }

        if (event.key !== 'Tab' || !nav.classList.contains('is-open')) {
            return;
        }

        const nodes = [toggle, ...nav.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) {
            return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    });

    desktopNav.addEventListener('change', () => {
        if (desktopNav.matches) {
            setOpen(false);
        }
        syncHeaderHeight();
    });

    window.addEventListener('resize', syncHeaderHeight);
    syncHeaderHeight();
}

function siteToastCopy() {
    const node = document.querySelector('[data-pwa-i18n]');
    if (!(node instanceof HTMLScriptElement)) {
        return { copied: 'Copied', copy_failed: 'Copy failed' };
    }
    try {
        return JSON.parse(node.textContent || '{}');
    } catch {
        return { copied: 'Copied', copy_failed: 'Copy failed' };
    }
}

function showToast(message, { sticky = false } = {}) {
    const toast = document.querySelector('[data-site-toast], [data-pwa-toast]');
    if (!(toast instanceof HTMLElement) || !message) {
        return;
    }
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast._timer);
    if (!sticky) {
        showToast._timer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.hidden = true;
        }, 3200);
    }
}

function initCopyButtons() {
    const labels = siteToastCopy();

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            try {
                const area = document.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', '');
                area.style.position = 'absolute';
                area.style.left = '-9999px';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
                return true;
            } catch {
                return false;
            }
        }
    };

    const markCopied = (el, copiedLabel) => {
        const label = el.textContent;
        el.classList.add('is-copied');
        if (copiedLabel && el.matches('button, .copy-btn, .dep-purl')) {
            el.textContent = copiedLabel;
            window.setTimeout(() => {
                el.classList.remove('is-copied');
                el.textContent = label;
            }, 1600);
            return;
        }
        window.setTimeout(() => {
            el.classList.remove('is-copied');
        }, 1600);
    };

    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            const target = button.getAttribute('data-copy');
            let text = button.getAttribute('data-copy-text') || '';

            if (!text && target) {
                const node = document.querySelector(target);
                text = node ? node.textContent.trim() : '';
            }

            if (!text) {
                return;
            }

            const ok = await copyText(text);
            const copied = button.getAttribute('data-copied-label') || labels.copied || 'Copied';
            if (ok) {
                markCopied(button, copied);
                showToast(copied);
            } else {
                showToast(labels.copy_failed || 'Copy failed');
            }
        });
    });

    document.querySelectorAll('[data-copy-text]:not([data-copy])').forEach((el) => {
        el.addEventListener('click', async () => {
            const text = el.getAttribute('data-copy-text') || el.textContent.trim();
            if (!text) {
                return;
            }

            const ok = await copyText(text);
            const copied = el.getAttribute('data-copied-label') || labels.copied || 'Copied';

            if (!ok) {
                showToast(labels.copy_failed || 'Copy failed');
                return;
            }

            el.classList.add('is-copied');
            el.setAttribute('aria-live', 'polite');

            const hint = el.parentElement?.querySelector(
                '.git-card__hint, .contact-panel__hint, .donate-panel__hint',
            );
            let previousHint = '';

            if (hint) {
                previousHint = hint.textContent;
                hint.textContent = copied;
            }

            showToast(copied);

            window.setTimeout(() => {
                el.classList.remove('is-copied');
                if (hint && previousHint) {
                    hint.textContent = previousHint;
                }
            }, 1600);
        });
    });
}

function initVideoEmbeds() {
    document.querySelectorAll('[data-video-embed]').forEach((root) => {
        if (root.querySelector('iframe')) {
            return;
        }

        const trigger = root.querySelector('[data-video-trigger]');
        const id = root.getAttribute('data-video-id');
        if (!trigger || !id || !YOUTUBE_ID_RE.test(id)) {
            return;
        }

        const title = trigger.getAttribute('aria-label') || 'YouTube video';

        trigger.addEventListener(
            'click',
            () => {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
                iframe.title = title;
                iframe.allow =
                    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                iframe.allowFullscreen = true;
                root.replaceChildren(iframe);
            },
            { once: true },
        );
    });
}

function canPrefetchAssets() {
    const connection = navigator.connection;
    if (connection?.saveData) {
        return false;
    }
    const slow = ['slow-2g', '2g'];
    return !slow.includes(connection?.effectiveType);
}

function prefetchAsset(src) {
    if (!src) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const img = new Image();
        const done = () => resolve();
        img.onload = () => {
            if (typeof img.decode === 'function') {
                img.decode().then(done).catch(done);
                return;
            }
            done();
        };
        img.onerror = done;
        img.src = src;
    });
}

function scheduleIdle(task) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(task, { timeout: 3000 });
        return;
    }
    window.setTimeout(task, 1200);
}

function initShowcase() {
    document.querySelectorAll('[data-showcase]').forEach((root) => {
        const tabs = Array.from(root.querySelectorAll('[data-showcase-tab]'));
        const lightImg = root.querySelector('[data-showcase-image="light"]');
        const darkImg = root.querySelector('[data-showcase-image="dark"]');
        const caption = root.querySelector('[data-showcase-caption]');
        if (!tabs.length || !lightImg || !darkImg) {
            return;
        }
        const images = [lightImg, darkImg];

        let manual = false;
        let timer = null;
        let busy = false;
        const delay = Number(root.getAttribute('data-showcase-autoplay') || 0);
        const fadeMs = 520;
        const prefetched = new Set();

        const srcsFor = (tab) => {
            const light = tab.getAttribute('data-src') || '';
            const dark = tab.getAttribute('data-src-dark') || light;
            return { light, dark };
        };

        const visibleImg = () =>
            document.documentElement.classList.contains('dark') ? darkImg : lightImg;

        const queuePrefetch = (src) => {
            if (!src || prefetched.has(src)) {
                return;
            }
            prefetched.add(src);
            prefetchAsset(src);
        };

        const prefetchTab = (tab) => {
            queuePrefetch(tab.getAttribute('data-src'));
            queuePrefetch(tab.getAttribute('data-src-dark'));
        };

        const prefetchAllTabs = () => {
            tabs.forEach((tab) => prefetchTab(tab));
        };

        const prefetchAdjacent = (tab) => {
            const index = tabs.indexOf(tab);
            if (index < 0) {
                return;
            }
            prefetchTab(tabs[(index + 1) % tabs.length]);
            prefetchTab(tabs[(index - 1 + tabs.length) % tabs.length]);
        };

        const activate = (tab, { animate = true } = {}) => {
            if (busy) {
                return;
            }

            tabs.forEach((item) => {
                const active = item === tab;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-selected', active ? 'true' : 'false');
            });

            const { light, dark } = srcsFor(tab);
            prefetchAdjacent(tab);
            const label = tab.getAttribute('data-label') || tab.textContent.trim();
            const applyMeta = () => {
                if (label) {
                    images.forEach((img) => img.setAttribute('alt', label));
                    if (caption) {
                        caption.textContent = label;
                    }
                }
            };

            const current =
                lightImg.getAttribute('src') === light && darkImg.getAttribute('src') === dark;
            if (!light || current) {
                applyMeta();
                return;
            }

            const swap = () => {
                lightImg.setAttribute('src', light);
                darkImg.setAttribute('src', dark);
                applyMeta();
                images.forEach((img) => img.classList.remove('is-fading'));
                busy = false;
            };

            if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                swap();
                return;
            }

            busy = true;
            images.forEach((img) => img.classList.add('is-fading'));
            window.setTimeout(() => {
                const shown = visibleImg();
                const onLoad = () => {
                    shown.removeEventListener('load', onLoad);
                    window.requestAnimationFrame(() => {
                        images.forEach((img) => img.classList.remove('is-fading'));
                        busy = false;
                    });
                };
                shown.addEventListener('load', onLoad);
                lightImg.setAttribute('src', light);
                darkImg.setAttribute('src', dark);
                applyMeta();
                window.setTimeout(() => {
                    if (busy) {
                        shown.removeEventListener('load', onLoad);
                        images.forEach((img) => img.classList.remove('is-fading'));
                        busy = false;
                    }
                }, fadeMs + 400);
            }, fadeMs);
        };

        const next = () => {
            const currentIndex = tabs.findIndex((tab) => tab.classList.contains('is-active'));
            const index = currentIndex < 0 ? 0 : (currentIndex + 1) % tabs.length;
            activate(tabs[index]);
        };

        const stopAutoplay = () => {
            manual = true;
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        };

        let inView = true;
        const pauseAutoplay = () => {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        };

        const startAutoplay = () => {
            if (
                manual ||
                !inView ||
                delay < 1000 ||
                document.hidden ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                return;
            }
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(next, delay);
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAutoplay();
                return;
            }
            startAutoplay();
        });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        inView = entry.isIntersecting && entry.intersectionRatio > 0.2;
                        if (inView) {
                            startAutoplay();
                        } else {
                            pauseAutoplay();
                        }
                    });
                },
                { threshold: [0, 0.2, 0.5] },
            );
            io.observe(root);
        }

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                stopAutoplay();
                activate(tab);
            });
        });

        const active = tabs.find((tab) => tab.classList.contains('is-active')) || tabs[0];
        activate(active, { animate: false });
        startAutoplay();

        if (canPrefetchAssets()) {
            scheduleIdle(prefetchAllTabs);
        }
    });
}

function detectDownloadPlatform() {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
        return 'android';
    }
    if (/iphone|ipad|ipod/i.test(ua)) {
        return 'macos';
    }
    if (/win/i.test(ua)) {
        return 'windows';
    }
    if (/mac/i.test(ua)) {
        return 'macos';
    }
    if (/linux|cros|x11/i.test(ua)) {
        return 'linux';
    }
    return 'linux';
}

function formatDownloadCta(template, platformLabel) {
    if (!template) {
        return platformLabel;
    }
    return template.includes('%s')
        ? template.replace('%s', platformLabel)
        : `${template} ${platformLabel}`;
}

function initHomeDownloadHint() {
    document.querySelectorAll('[data-home-download]').forEach((link) => {
        if (!(link instanceof HTMLAnchorElement)) {
            return;
        }
        const platform = detectDownloadPlatform();
        const base = link.getAttribute('data-download-base') || link.href;
        const template = link.getAttribute('data-cta-template') || '';
        let labels = {};
        try {
            labels = JSON.parse(link.getAttribute('data-platform-labels') || '{}');
        } catch {
            labels = {};
        }
        const label = labels[platform] || platform;
        link.href = `${base}#${platform}`;
        link.textContent = formatDownloadCta(template, label);
    });
}

function syncDownloadHero(platformId) {
    const hero = document.querySelector('[data-download-hero]');
    if (!(hero instanceof HTMLElement)) {
        return;
    }

    const btn = hero.querySelector('[data-download-hero-btn]');
    const labelNode = hero.querySelector('[data-download-hero-label]');
    const checksum = hero.querySelector('[data-download-hero-checksum]');
    const checksumValue = hero.querySelector('[data-download-hero-checksum-value]');
    if (!(btn instanceof HTMLAnchorElement)) {
        return;
    }

    let meta = null;
    const script = hero.querySelector(`[data-download-hero-platform="${platformId}"]`);
    if (script instanceof HTMLScriptElement) {
        try {
            meta = JSON.parse(script.textContent || '{}');
        } catch {
            meta = null;
        }
    }

    const template = hero.getAttribute('data-cta-template') || '';
    const label = meta?.label || platformId;
    const rawUrl = typeof meta?.url === 'string' && meta.url !== '' ? meta.url : `#${platformId}`;
    const url = isSafeHttpUrl(rawUrl) ? rawUrl : `#${platformId}`;
    const sha256 = typeof meta?.sha256 === 'string' && meta.sha256 !== '' ? meta.sha256 : '';
    const cta = formatDownloadCta(template, label);
    const isExternal = /^https?:\/\//i.test(url);
    const isAsset = isExternal;

    btn.href = url;
    btn.hidden = false;
    if (isAsset) {
        btn.setAttribute('download', '');
    } else {
        btn.removeAttribute('download');
    }
    btn.removeAttribute('target');
    btn.removeAttribute('rel');
    if (labelNode) {
        labelNode.textContent = cta;
    } else {
        btn.textContent = cta;
    }

    if (checksum instanceof HTMLElement && checksumValue instanceof HTMLElement) {
        if (sha256 !== '') {
            checksumValue.textContent = sha256;
            checksumValue.setAttribute('data-copy-text', sha256);
            const ariaPrefix = checksumValue.getAttribute('data-copy-aria-prefix') || '';
            if (ariaPrefix !== '') {
                checksumValue.setAttribute('aria-label', `${ariaPrefix}: ${sha256}`);
            }
            checksum.hidden = false;
        } else {
            checksumValue.textContent = '';
            checksumValue.setAttribute('data-copy-text', '');
            const ariaPrefix = checksumValue.getAttribute('data-copy-aria-prefix');
            if (ariaPrefix) {
                checksumValue.setAttribute('aria-label', ariaPrefix);
            }
            checksum.hidden = true;
        }
    }
}

function initDownloadVersionSelect() {
    document.querySelectorAll('[data-download-version]').forEach((node) => {
        if (!(node instanceof HTMLSelectElement)) {
            return;
        }
        node.addEventListener('change', () => {
            const base = node.getAttribute('data-download-version-base') || '/download';
            const channel = node.getAttribute('data-download-version-channel') || 'stable';
            const source = node.getAttribute('data-download-version-source') || '';
            const tag = node.value;
            const url = new URL(base, window.location.origin);
            url.searchParams.set('channel', channel);
            if (tag) {
                url.searchParams.set('v', tag);
            } else {
                url.searchParams.delete('v');
            }
            if (source === 'bunny' || source === 'github') {
                url.searchParams.set('source', source);
            } else {
                url.searchParams.delete('source');
            }
            const hash = window.location.hash || '';
            window.location.assign(`${url.pathname}${url.search}${hash}`);
        });
    });
}

function initDownloadSourceSelect() {
    document.querySelectorAll('[data-download-source]').forEach((node) => {
        if (!(node instanceof HTMLSelectElement)) {
            return;
        }
        node.addEventListener('change', () => {
            const base = node.getAttribute('data-download-source-base') || '/download';
            const channel = node.getAttribute('data-download-source-channel') || 'stable';
            const version = node.getAttribute('data-download-source-version') || '';
            const source = node.value;
            const url = new URL(base, window.location.origin);
            url.searchParams.set('channel', channel);
            if (version) {
                url.searchParams.set('v', version);
            } else {
                url.searchParams.delete('v');
            }
            if (source === 'bunny' || source === 'github') {
                url.searchParams.set('source', source);
            } else {
                url.searchParams.delete('source');
            }
            const hash = window.location.hash || '';
            window.location.assign(`${url.pathname}${url.search}${hash}`);
        });
    });
}

function initDownloadChannels() {
    document.querySelectorAll('[data-download]').forEach((root) => {
        const tabs = Array.from(root.querySelectorAll('[data-download-tab]'));
        const panels = Array.from(root.querySelectorAll('[data-download-panel]'));

        const showPanel = (id, syncHash = true) => {
            if (!id) {
                return;
            }
            tabs.forEach((tab) => {
                const active = tab.getAttribute('data-download-tab') === id;
                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            panels.forEach((panel) => {
                const active = panel.getAttribute('data-download-panel') === id;
                panel.classList.toggle('is-active', active);
                panel.hidden = !active;
            });
            syncDownloadHero(id);
            if (syncHash && window.history?.replaceState) {
                window.history.replaceState(null, '', `#${id}`);
            }
        };

        tabs.forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                showPanel(tab.getAttribute('data-download-tab'));
            });
        });

        const hashId = (window.location.hash || '').replace(/^#/, '');
        const fromHash = tabs.find((tab) => tab.getAttribute('data-download-tab') === hashId);
        const detected = detectDownloadPlatform();
        const detectedTab = tabs.find((tab) => tab.getAttribute('data-download-tab') === detected);
        const initial =
            fromHash?.getAttribute('data-download-tab') ||
            detectedTab?.getAttribute('data-download-tab') ||
            tabs
                .find((tab) => tab.classList.contains('is-active'))
                ?.getAttribute('data-download-tab') ||
            tabs[0]?.getAttribute('data-download-tab');
        if (initial) {
            showPanel(initial, Boolean(fromHash));
            if (!fromHash && detectedTab && window.history?.replaceState) {
                window.history.replaceState(null, '', `#${initial}`);
            }
        }

        window.addEventListener('hashchange', () => {
            const next = (window.location.hash || '').replace(/^#/, '');
            if (tabs.some((tab) => tab.getAttribute('data-download-tab') === next)) {
                showPanel(next, false);
            }
        });

        root.querySelectorAll('[data-channel-group]').forEach((group) => {
            const buttons = Array.from(group.querySelectorAll('[data-channel]'));
            const targets = Array.from(
                group.querySelectorAll('[data-channel-content], [data-channel-cmd]'),
            );

            const activate = (channel) => {
                buttons.forEach((button) => {
                    button.classList.toggle(
                        'is-active',
                        button.getAttribute('data-channel') === channel,
                    );
                });
                targets.forEach((node) => {
                    const match = node.getAttribute('data-channel-content') === channel;
                    const cmd = node.getAttribute('data-channel-cmd');
                    if (cmd !== null) {
                        if (cmd === channel) {
                            node.hidden = false;
                        } else {
                            node.hidden = true;
                        }
                        return;
                    }
                    node.hidden = !match;
                });
            };

            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    activate(button.getAttribute('data-channel'));
                });
            });

            const start =
                buttons
                    .find((button) => button.classList.contains('is-active'))
                    ?.getAttribute('data-channel') || buttons[0]?.getAttribute('data-channel');
            if (start) {
                activate(start);
            }
        });
    });
}

function initInterfaceDirectory() {
    const root = document.querySelector('[data-ifx]');
    if (!root) {
        return;
    }

    const search = root.querySelector('[data-ifx-search]');
    const status = root.querySelector('[data-ifx-status]');
    const countEl = root.querySelector('[data-ifx-count]');
    const showingTemplate = root.getAttribute('data-showing-template') || '%shown / %total';
    const cards = Array.from(root.querySelectorAll('[data-ifx-card]'));
    const typeButtons = Array.from(root.querySelectorAll('[data-ifx-type]'));
    const networkButtons = Array.from(root.querySelectorAll('[data-ifx-network]'));
    let type = '';
    let network = '';

    const setActive = (buttons, value, attr) => {
        buttons.forEach((button) => {
            button.classList.toggle('is-active', (button.getAttribute(attr) || '') === value);
        });
    };

    const apply = () => {
        const needle = (search?.value || '').trim().toLowerCase();
        let visible = 0;

        cards.forEach((card) => {
            const matchType = !type || card.getAttribute('data-type') === type;
            const matchNetwork = !network || card.getAttribute('data-network') === network;
            const hay = [
                card.getAttribute('data-name'),
                card.getAttribute('data-host'),
                card.getAttribute('data-type'),
                card.getAttribute('data-typename'),
                card.getAttribute('data-network'),
            ]
                .join(' ')
                .toLowerCase();
            const show = matchType && matchNetwork && (!needle || hay.includes(needle));
            card.hidden = !show;
            if (show) {
                visible += 1;
            }
        });

        root.querySelectorAll('[data-ifx-group]').forEach((group) => {
            const groupVisible = group.querySelectorAll('[data-ifx-card]:not([hidden])').length;
            group.hidden = groupVisible === 0;
            const counter = group.querySelector('[data-ifx-group-count]');
            if (counter) {
                counter.textContent = String(groupVisible);
            }
        });

        if (countEl) {
            countEl.textContent = showingTemplate
                .replace('%shown', String(visible))
                .replace('%total', String(cards.length));
        }

        if (status) {
            status.hidden = visible > 0;
        }
    };

    typeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            type = button.getAttribute('data-ifx-type') || '';
            setActive(typeButtons, type, 'data-ifx-type');
            apply();
        });
    });

    networkButtons.forEach((button) => {
        button.addEventListener('click', () => {
            network = button.getAttribute('data-ifx-network') || '';
            setActive(networkButtons, network, 'data-ifx-network');
            apply();
        });
    });

    search?.addEventListener('input', apply);
}

function initLangPicker() {
    document.querySelectorAll('[data-lang-picker]').forEach((root) => {
        const trigger = root.querySelector('[data-lang-trigger]');
        if (!trigger) {
            return;
        }

        trigger.addEventListener('click', () => {
            const open = !root.classList.contains('is-open');
            closeThemePickers();
            document.querySelectorAll('[data-lang-picker].is-open').forEach((other) => {
                if (other !== root) {
                    other.classList.remove('is-open');
                    other
                        .querySelector('[data-lang-trigger]')
                        ?.setAttribute('aria-expanded', 'false');
                }
            });
            if (open) {
                setMobileNavOpen(false);
            }
            root.classList.toggle('is-open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    document.addEventListener('click', (event) => {
        document.querySelectorAll('[data-lang-picker].is-open').forEach((root) => {
            if (!root.contains(event.target)) {
                root.classList.remove('is-open');
                const trigger = root.querySelector('[data-lang-trigger]');
                trigger?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function initSectionReveal() {
    const sections = document.querySelectorAll('[data-reveal]');
    if (!sections.length) {
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sections.forEach((section) => section.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
}

function initDocs() {
    const shell = document.querySelector('[data-docs-shell]');
    if (!shell) {
        return;
    }

    const sidebar = document.querySelector('[data-docs-sidebar]');
    const sidebarToggle = document.querySelector('[data-docs-sidebar-toggle]');
    const searchRoot = document.querySelector('[data-docs-search]');
    const searchOpeners = document.querySelectorAll('[data-docs-search-open]');
    const searchInput = document.querySelector('[data-docs-search-input]');
    const searchResults = document.querySelector('[data-docs-search-results]');
    const searchEmpty = document.querySelector('[data-docs-search-empty]');
    const indexNode = document.querySelector('[data-docs-search-index]');

    let index = [];
    if (indexNode) {
        try {
            index = JSON.parse(indexNode.textContent || '[]');
        } catch {
            index = [];
        }
    }

    const fuse = new Fuse(index, {
        includeScore: true,
        shouldSort: true,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
            { name: 'title', weight: 0.4 },
            { name: 'description', weight: 0.25 },
            { name: 'headings', weight: 0.2 },
            { name: 'body', weight: 0.15 },
        ],
    });

    const setSidebarOpen = (open) => {
        if (!sidebar || !sidebarToggle) {
            return;
        }
        sidebar.classList.toggle('is-open', open);
        sidebarToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.documentElement.classList.toggle('docs-nav-open', open);
        if (open) {
            window.requestAnimationFrame(() => {
                sidebar
                    .querySelector('.docs-nav__link.is-active')
                    ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }
    };

    sidebarToggle?.addEventListener('click', () => {
        setSidebarOpen(!sidebar?.classList.contains('is-open'));
    });

    sidebar?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setSidebarOpen(false));
    });

    const closeSearch = () => {
        if (!searchRoot) {
            return;
        }
        searchRoot.hidden = true;
        document.documentElement.classList.remove('docs-search-open');
    };

    const openSearch = () => {
        if (!searchRoot || !searchInput) {
            return;
        }
        setSidebarOpen(false);
        searchRoot.hidden = false;
        document.documentElement.classList.add('docs-search-open');
        searchInput.value = '';
        renderSearch('');
        window.requestAnimationFrame(() => searchInput.focus());
    };

    const renderSearch = (query) => {
        if (!searchResults || !searchEmpty) {
            return;
        }

        const q = query.trim();
        const matches = !q
            ? index.slice(0, 8)
            : fuse.search(q, { limit: 12 }).map((row) => row.item);

        searchResults.innerHTML = '';
        searchEmpty.hidden = matches.length > 0;

        matches.forEach((item, i) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'docs-search__result' + (i === 0 ? ' is-active' : '');
            a.href = isSafeHttpUrl(item.href) ? item.href : '#';
            a.setAttribute('role', 'option');

            const title = document.createElement('span');
            title.className = 'docs-search__result-title';
            title.textContent = item.title;
            a.appendChild(title);

            if (item.description) {
                const desc = document.createElement('span');
                desc.className = 'docs-search__result-desc';
                desc.textContent = item.description;
                a.appendChild(desc);
            }

            li.appendChild(a);
            searchResults.appendChild(li);
        });
    };

    searchOpeners.forEach((btn) => btn.addEventListener('click', openSearch));
    searchRoot?.querySelector('[data-docs-search-close]')?.addEventListener('click', closeSearch);
    searchInput?.addEventListener('input', () => renderSearch(searchInput.value));

    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
            return;
        }
        if (event.key !== 'Enter') {
            return;
        }
        const active = searchResults?.querySelector('.docs-search__result.is-active');
        if (active instanceof HTMLAnchorElement) {
            event.preventDefault();
            window.location.href = active.href;
        }
    });

    document.addEventListener('keydown', (event) => {
        const target = event.target;
        const typing =
            target instanceof HTMLElement &&
            (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable);

        if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            openSearch();
            return;
        }

        if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            openSearch();
            return;
        }

        if (event.key === 'Escape') {
            closeSearch();
            setSidebarOpen(false);
        }
    });

    const tocLinks = Array.from(document.querySelectorAll('.docs-toc a[href^="#"]'));
    if (tocLinks.length && 'IntersectionObserver' in window) {
        const map = new Map();
        tocLinks.forEach((link) => {
            const id = decodeURIComponent(link.getAttribute('href').slice(1));
            const el = document.getElementById(id);
            if (el) {
                map.set(el, link.parentElement);
            }
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const item = map.get(entry.target);
                    if (!item) {
                        return;
                    }
                    item.classList.toggle('is-active', entry.isIntersecting);
                });
            },
            { rootMargin: '-20% 0px -65% 0px', threshold: [0, 1] },
        );

        map.forEach((_, el) => observer.observe(el));
    }
}

function initRoadmapRail() {
    const rail = document.querySelector('[data-roadmap-rail]');
    if (!(rail instanceof HTMLElement)) {
        return;
    }

    const tip = rail.querySelector('[data-roadmap-tip]');
    const tipTitle = tip?.querySelector('[data-roadmap-tip-title]');
    const tipDate = tip?.querySelector('[data-roadmap-tip-date]');
    const tipList = tip?.querySelector('[data-roadmap-tip-list]');
    const tipLink = tip?.querySelector('[data-roadmap-tip-link]');
    if (
        !(tip instanceof HTMLElement) ||
        !(tipTitle instanceof HTMLElement) ||
        !(tipDate instanceof HTMLElement) ||
        !(tipList instanceof HTMLElement) ||
        !(tipLink instanceof HTMLAnchorElement)
    ) {
        return;
    }

    const nodes = Array.from(rail.querySelectorAll('[data-roadmap-preview]'));
    let hideTimer = 0;
    let activeNode = null;

    const hideTip = () => {
        tip.hidden = true;
        activeNode = null;
        rail.style.marginBottom = '';
    };

    const scheduleHide = () => {
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            if (
                !tip.matches(':hover') &&
                activeNode &&
                !activeNode.matches(':hover, :focus-visible')
            ) {
                hideTip();
            }
        }, 120);
    };

    const showTip = (node) => {
        window.clearTimeout(hideTimer);
        activeNode = node;

        let bullets = [];
        try {
            bullets = JSON.parse(node.getAttribute('data-preview-bullets') || '[]');
        } catch {
            bullets = [];
        }
        if (!Array.isArray(bullets) || bullets.length === 0) {
            hideTip();
            return;
        }

        tipTitle.textContent = node.getAttribute('data-preview-title') || '';
        const date = node.getAttribute('data-preview-date') || '';
        tipDate.textContent = date;
        tipDate.hidden = date === '';
        tipLink.href = isSafeHttpUrl(node.getAttribute('data-preview-href') || '#')
            ? node.getAttribute('data-preview-href') || '#'
            : '#';
        tipList.replaceChildren();
        bullets.forEach((bullet) => {
            const li = document.createElement('li');
            li.textContent = String(bullet);
            tipList.append(li);
        });

        tip.hidden = false;

        const railRect = rail.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const tipWidth = Math.min(tip.offsetWidth || 280, rail.clientWidth - 24);
        let left = nodeRect.left - railRect.left + nodeRect.width / 2 - tipWidth / 2;
        left = Math.max(12, Math.min(left, rail.clientWidth - tipWidth - 12));
        tip.style.left = `${left}px`;
        rail.style.marginBottom = `${Math.max(tip.offsetHeight + 28, 40)}px`;
    };

    nodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
            return;
        }
        node.addEventListener('mouseenter', () => showTip(node));
        node.addEventListener('focus', () => showTip(node));
        node.addEventListener('mouseleave', scheduleHide);
        node.addEventListener('blur', scheduleHide);
    });

    tip.addEventListener('mouseenter', () => window.clearTimeout(hideTimer));
    tip.addEventListener('mouseleave', scheduleHide);
}

function scrubChangelogFragment(root) {
    root.querySelectorAll('script, iframe, object, embed, form, link, meta, style').forEach(
        (node) => {
            node.remove();
        },
    );

    root.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value || '';
            if (name.startsWith('on') || name === 'srcdoc') {
                el.removeAttribute(attr.name);
                return;
            }
            if (
                (name === 'href' || name === 'src' || name === 'xlink:href') &&
                isDangerousUri(value)
            ) {
                el.removeAttribute(attr.name);
            }
        });
    });
}

function appendChangelogHtml(list, html) {
    const parsed = new DOMParser().parseFromString(
        `<div id="mcx-changelog-root">${html}</div>`,
        'text/html',
    );
    const fragmentRoot = parsed.getElementById('mcx-changelog-root');
    if (!fragmentRoot) {
        return 0;
    }

    scrubChangelogFragment(fragmentRoot);

    let added = 0;
    Array.from(fragmentRoot.children).forEach((node) => {
        if (
            !(node instanceof HTMLElement) ||
            node.tagName !== 'LI' ||
            !node.classList.contains('changelog-entry')
        ) {
            return;
        }
        const id = node.id || '';
        if (id && list.querySelector(`#${CSS.escape(id)}`)) {
            return;
        }
        list.appendChild(document.importNode(node, true));
        added += 1;
    });

    return added;
}

function initChangelog() {
    const root = document.querySelector('[data-changelog]');
    if (!(root instanceof HTMLElement)) {
        return;
    }

    const list = root.querySelector('[data-changelog-list]');
    const more = root.querySelector('[data-changelog-more]');
    const sentinel = root.querySelector('[data-changelog-sentinel]');
    const loadBtn = root.querySelector('[data-changelog-load]');
    const status = root.querySelector('[data-changelog-status]');
    const entriesUrl = root.getAttribute('data-entries-url') || '';
    if (!(list instanceof HTMLElement) || !entriesUrl) {
        return;
    }

    let nextPage = root.getAttribute('data-next-page') || '';
    let hasMore = root.getAttribute('data-has-more') === '1';
    let loading = false;

    const setStatus = (visible) => {
        if (status instanceof HTMLElement) {
            status.hidden = !visible;
        }
    };

    const syncMore = () => {
        if (more instanceof HTMLElement) {
            more.hidden = !hasMore;
        }
        if (loadBtn instanceof HTMLButtonElement) {
            loadBtn.disabled = !hasMore || loading;
        }
    };

    const fetchPage = async (page, until = '') => {
        const url = new URL(entriesUrl, window.location.origin);
        url.searchParams.set('page', String(page));
        if (until) {
            url.searchParams.set('until', until);
        }

        const response = await fetch(url.toString(), {
            headers: { Accept: 'text/html' },
            credentials: 'same-origin',
        });
        if (!response.ok) {
            throw new Error('changelog fetch failed');
        }

        const html = await response.text();
        appendChangelogHtml(list, html);

        hasMore = response.headers.get('X-Changelog-Has-More') === '1';
        nextPage = response.headers.get('X-Changelog-Next-Page') || '';
        root.setAttribute('data-has-more', hasMore ? '1' : '0');
        root.setAttribute('data-next-page', nextPage);
        root.setAttribute('data-page', response.headers.get('X-Changelog-Page') || String(page));
        syncMore();
    };

    const loadNext = async (until = '') => {
        if (loading) {
            return false;
        }
        if (!until && (!hasMore || !nextPage)) {
            return false;
        }
        if (!nextPage) {
            return false;
        }

        loading = true;
        setStatus(true);
        syncMore();
        try {
            await fetchPage(nextPage, until);
            return true;
        } catch {
            return false;
        } finally {
            loading = false;
            setStatus(false);
            syncMore();
        }
    };

    const ensureAnchor = async (anchor) => {
        if (!anchor || !/^v-[0-9a-z]+(?:-[0-9a-z]+)*$/.test(anchor)) {
            return null;
        }
        let el = document.getElementById(anchor);
        if (el) {
            return el;
        }
        if (!hasMore || !nextPage) {
            return null;
        }
        await loadNext(anchor);
        return document.getElementById(anchor);
    };

    loadBtn?.addEventListener('click', () => {
        void loadNext();
    });

    root.querySelectorAll('[data-changelog-toc]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const anchor = link.getAttribute('data-changelog-toc') || '';
            if (!anchor || document.getElementById(anchor)) {
                return;
            }
            event.preventDefault();
            void ensureAnchor(anchor).then((el) => {
                if (el) {
                    history.replaceState(null, '', `#${anchor}`);
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });

    if (sentinel instanceof HTMLElement && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        void loadNext();
                    }
                });
            },
            { rootMargin: '240px 0px' },
        );
        observer.observe(sentinel);
    }

    const hash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    if (hash) {
        void ensureAnchor(hash).then((el) => {
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    syncMore();
}

function pwaI18n() {
    const node = document.querySelector('[data-pwa-i18n]');
    if (!(node instanceof HTMLScriptElement)) {
        return { updating: 'Updating…', offline: 'You are offline', online: 'Back online' };
    }
    try {
        return JSON.parse(node.textContent || '{}');
    } catch {
        return { updating: 'Updating…', offline: 'You are offline', online: 'Back online' };
    }
}

function showPwaToast(message, { sticky = false } = {}) {
    showToast(message, { sticky });
}

function initOfflineRetry() {
    document.querySelector('[data-offline-retry]')?.addEventListener('click', () => {
        window.location.reload();
    });
}

function parseJsonScript(root, selector, fallback) {
    const node = root.querySelector(selector);
    if (!(node instanceof HTMLScriptElement)) {
        return fallback;
    }
    try {
        return JSON.parse(node.textContent || '');
    } catch {
        return fallback;
    }
}

function initDependencyViewer() {
    const root = document.querySelector('[data-dep]');
    if (!(root instanceof HTMLElement)) {
        return;
    }

    const i18n = parseJsonScript(root, '[data-dep-i18n]', {});
    const sbomBase = root.getAttribute('data-sbom-base') || '/api/mcx-sbom';
    const logoUrl = root.getAttribute('data-logo') || '/logo.webp';

    const versionSelect = root.querySelector('[data-dep-version]');
    const searchInput = root.querySelector('[data-dep-search]');
    const ecoGroup = root.querySelector('[data-dep-ecosystems]');
    const statusEl = root.querySelector('[data-dep-status]');
    const layout = root.querySelector('[data-dep-layout]');
    const statsEl = root.querySelector('[data-dep-stats]');
    const treeEl = root.querySelector('[data-dep-tree]');
    const tableBody = root.querySelector('[data-dep-table]');
    const tableWrap = root.querySelector('[data-dep-table-wrap]');
    const tableMeta = root.querySelector('[data-dep-table-meta]');
    const tableEmpty = root.querySelector('[data-dep-table-empty]');
    const detail = root.querySelector('[data-dep-detail]');
    const detailLogo = root.querySelector('[data-dep-detail-logo]');
    const downloadLink = root.querySelector('[data-dep-download]');
    const releaseLink = root.querySelector('[data-dep-release]');

    const catalog = parseJsonScript(root, '[data-dep-catalog]', {
        versions: [],
        defaultVersion: null,
    });
    let sbom = parseJsonScript(root, '[data-dep-sbom]', null);
    let eco = '';
    let focusId = null;
    let view = 'table';
    let outgoing = new Map();
    let incoming = new Map();
    let nodeById = new Map();
    let loading = false;
    let filteredCache = null;
    let filteredKey = '';
    let tableRows = [];
    let tableFilterKey = '';
    let tablePaintRaf = 0;
    let searchTimer = 0;
    const TABLE_ROW_H = 36;
    const TABLE_OVERSCAN = 10;
    const TREE_BATCH = 48;

    const nodeLabel = (node) => node?.label || node?.name || '';
    const nodeLabelFull = (node) =>
        node?.version ? `${nodeLabel(node)}@${node.version}` : nodeLabel(node);

    const isAppNode = (node) => Boolean(node?.logo || node?.kind === 'app');

    const isManifestNode = (node) =>
        Boolean(node?.kind === 'manifest' || (sbom?.manifestIds || []).includes(node?.id));

    const nodeEcosystems = (node) => {
        if (Array.isArray(node?.ecosystems) && node.ecosystems.length) {
            return node.ecosystems;
        }
        return node?.ecosystem ? [node.ecosystem] : [];
    };

    const setStatus = (message, visible) => {
        if (!(statusEl instanceof HTMLElement)) {
            return;
        }
        if (message) {
            statusEl.textContent = message;
        }
        statusEl.hidden = !visible;
    };

    const formatShowing = (shown, total) => {
        const template = i18n.showing || '%shown of %total';
        return template.replace('%shown', String(shown)).replace('%total', String(total));
    };

    const formatCount = (template, count) => (template || '%n').replace('%n', String(count));

    const topEntries = (obj, limit = 3) => {
        if (!obj || typeof obj !== 'object') {
            return [];
        }
        return Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    };

    const syncQuery = () => {
        if (!window.history?.replaceState) {
            return;
        }
        const url = new URL(window.location.href);
        const selected = root.getAttribute('data-selected') || '';
        if (selected) {
            url.searchParams.set('v', selected);
        }
        const q = (searchInput instanceof HTMLInputElement ? searchInput.value : '').trim();
        if (q) {
            url.searchParams.set('q', q);
        } else {
            url.searchParams.delete('q');
        }
        window.history.replaceState(null, '', url.toString());
    };

    const syncInspector = () => {
        if (layout instanceof HTMLElement) {
            layout.classList.toggle(
                'is-inspector-open',
                detail instanceof HTMLElement && !detail.hidden,
            );
        }
    };

    const indexGraph = (payload) => {
        outgoing = new Map();
        incoming = new Map();
        nodeById = new Map();
        (payload.nodes || []).forEach((node) => {
            nodeById.set(node.id, node);
            outgoing.set(node.id, []);
            incoming.set(node.id, []);
        });
        (payload.edges || []).forEach(([from, to]) => {
            if (!outgoing.has(from) || !incoming.has(to)) {
                return;
            }
            outgoing.get(from).push(to);
            incoming.get(to).push(from);
        });
    };

    const filteredNodes = () => {
        if (!sbom) {
            return [];
        }
        const needle = (searchInput instanceof HTMLInputElement ? searchInput.value : '')
            .trim()
            .toLowerCase();
        const key = `${eco}${needle}`;
        if (filteredCache && filteredKey === key) {
            return filteredCache;
        }
        filteredKey = key;
        filteredCache = (sbom.nodes || []).filter((node) => {
            if (eco && !nodeEcosystems(node).includes(eco)) {
                return false;
            }
            if (!needle) {
                return true;
            }
            const hay = [
                node.label,
                node.name,
                node.version,
                node.ecosystem,
                node.license,
                node.purl,
                node.type,
                node.kind,
                ...nodeEcosystems(node),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(needle);
        });
        return filteredCache;
    };

    const invalidateFilter = () => {
        filteredCache = null;
        filteredKey = '';
    };

    const refreshActiveView = () => {
        if (view === 'table') {
            renderTable(true);
        } else if (view === 'tree') {
            renderTree();
        }
    };

    const renderEcosystems = () => {
        if (!(ecoGroup instanceof HTMLElement) || !sbom) {
            return;
        }
        const entries = topEntries(sbom.stats?.ecosystems || {}, 8);
        ecoGroup.replaceChildren();
        const all = document.createElement('button');
        all.type = 'button';
        all.className = 'channel-toggle__btn' + (eco === '' ? ' is-active' : '');
        all.setAttribute('data-dep-eco', '');
        all.textContent = i18n.ecosystem_all || 'All';
        ecoGroup.append(all);
        entries.forEach(([name]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'channel-toggle__btn' + (eco === name ? ' is-active' : '');
            btn.setAttribute('data-dep-eco', name);
            btn.textContent = name;
            ecoGroup.append(btn);
        });
    };

    const renderStats = () => {
        if (!(statsEl instanceof HTMLElement)) {
            return;
        }
        if (!sbom) {
            statsEl.hidden = true;
            return;
        }
        statsEl.hidden = false;
        const packages = root.querySelector('[data-dep-stat-packages]');
        const edges = root.querySelector('[data-dep-stat-edges]');
        const ecoStat = root.querySelector('[data-dep-stat-ecosystems]');
        if (packages) {
            packages.textContent = String(sbom.stats?.components ?? 0);
        }
        if (edges) {
            edges.textContent = String(sbom.stats?.edges ?? 0);
        }
        if (ecoStat) {
            ecoStat.textContent = topEntries(sbom.stats?.ecosystems || {}, 4)
                .map(([k, v]) => `${k} ${v}`)
                .join(' · ');
        }
    };

    const syncLinks = () => {
        if (downloadLink instanceof HTMLAnchorElement) {
            if (sbom?.sourceUrl && isSafeHttpUrl(sbom.sourceUrl, { allowRelative: false })) {
                downloadLink.href = sbom.sourceUrl;
                downloadLink.hidden = false;
                downloadLink.setAttribute('download', '');
            } else {
                downloadLink.hidden = true;
            }
        }
        if (releaseLink instanceof HTMLAnchorElement) {
            if (sbom?.releaseUrl && isSafeHttpUrl(sbom.releaseUrl, { allowRelative: false })) {
                releaseLink.href = sbom.releaseUrl;
                releaseLink.hidden = false;
            } else {
                releaseLink.hidden = true;
            }
        }
        if (searchInput instanceof HTMLInputElement) {
            searchInput.disabled = !sbom;
        }
    };

    const selectFocus = (id) => {
        focusId = id;
        renderDetail();
        if (view === 'table') {
            scrollTableToFocus();
            paintTableWindow();
        } else if (view === 'tree') {
            highlightTree();
        }
        syncInspector();
    };

    const renderDetail = () => {
        if (!(detail instanceof HTMLElement)) {
            return;
        }
        const node = focusId !== null ? nodeById.get(focusId) : null;
        if (!node || focusId === sbom?.rootId) {
            detail.hidden = true;
            syncInspector();
            return;
        }
        detail.hidden = false;
        const setText = (sel, value) => {
            const el = detail.querySelector(sel);
            if (el) {
                el.textContent = value || '-';
            }
        };
        setText('[data-dep-detail-name]', nodeLabel(node));
        setText('[data-dep-detail-version]', node.version);
        setText('[data-dep-detail-eco]', nodeEcosystems(node).join(', '));
        setText('[data-dep-detail-license]', node.license || i18n.unknown_license || 'Unknown');
        setText('[data-dep-detail-type]', node.type);
        if (detailLogo instanceof HTMLImageElement) {
            detailLogo.hidden = !isAppNode(node);
        }
        const purlBtn = detail.querySelector('[data-dep-detail-purl]');
        if (purlBtn instanceof HTMLElement) {
            purlBtn.textContent = node.purl || node.name || '-';
            if (node.purl) {
                purlBtn.setAttribute('data-copy-text', node.purl);
            } else {
                purlBtn.removeAttribute('data-copy-text');
            }
        }

        const fillList = (sel, ids) => {
            const ul = detail.querySelector(sel);
            if (!(ul instanceof HTMLElement)) {
                return;
            }
            ul.replaceChildren();
            if (!ids.length) {
                const li = document.createElement('li');
                li.className = 'dep-detail__empty';
                li.textContent = i18n.none || 'None';
                ul.append(li);
                return;
            }
            ids.slice(0, 48).forEach((id) => {
                const target = nodeById.get(id);
                if (!target) {
                    return;
                }
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'dep-link';
                btn.textContent = nodeLabelFull(target);
                btn.addEventListener('click', () => selectFocus(id));
                li.append(btn);
                ul.append(li);
            });
        };

        fillList('[data-dep-detail-deps]', outgoing.get(node.id) || []);
        fillList('[data-dep-detail-used]', incoming.get(node.id) || []);
        syncInspector();
    };

    const ensureTableScroll = () => {
        if (!(tableWrap instanceof HTMLElement) || tableWrap.dataset.bound === '1') {
            return;
        }
        tableWrap.dataset.bound = '1';
        tableWrap.addEventListener(
            'scroll',
            () => {
                if (view !== 'table' || tablePaintRaf) {
                    return;
                }
                tablePaintRaf = window.requestAnimationFrame(() => {
                    tablePaintRaf = 0;
                    paintTableWindow();
                });
            },
            { passive: true },
        );
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => {
                if (view === 'table') {
                    paintTableWindow();
                }
            });
            ro.observe(tableWrap);
        }
    };

    const scrollTableToFocus = () => {
        if (!(tableWrap instanceof HTMLElement) || focusId === null) {
            return;
        }
        const index = tableRows.findIndex((node) => node.id === focusId);
        if (index < 0) {
            return;
        }
        const top = index * TABLE_ROW_H;
        const viewTop = tableWrap.scrollTop;
        const viewBottom = viewTop + tableWrap.clientHeight - TABLE_ROW_H * 2;
        if (top < viewTop || top > viewBottom) {
            tableWrap.scrollTop = Math.max(0, top - TABLE_ROW_H * 2);
        }
    };

    const paintTableWindow = () => {
        if (!(tableBody instanceof HTMLElement) || !(tableWrap instanceof HTMLElement)) {
            return;
        }
        const total = tableRows.length;
        if (!total) {
            tableBody.replaceChildren();
            return;
        }

        const scrollTop = tableWrap.scrollTop;
        const start = Math.max(0, Math.floor(scrollTop / TABLE_ROW_H) - TABLE_OVERSCAN);
        const visible = Math.ceil(tableWrap.clientHeight / TABLE_ROW_H) + TABLE_OVERSCAN * 2;
        const end = Math.min(total, start + Math.max(visible, 24));
        const frag = document.createDocumentFragment();

        const topSpacer = document.createElement('tr');
        topSpacer.className = 'dep-table__spacer';
        const topTd = document.createElement('td');
        topTd.colSpan = 5;
        topTd.style.height = `${start * TABLE_ROW_H}px`;
        topSpacer.append(topTd);
        frag.append(topSpacer);

        for (let i = start; i < end; i += 1) {
            const node = tableRows[i];
            const tr = document.createElement('tr');
            if (focusId === node.id) {
                tr.classList.add('is-active');
            }
            const cells = [
                node.version || '-',
                nodeEcosystems(node).join(', ') || '-',
                node.license || i18n.unknown_license || '-',
                node.type || '-',
            ];
            const nameTd = document.createElement('td');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dep-link';
            btn.textContent = nodeLabel(node);
            btn.title = nodeLabelFull(node);
            btn.addEventListener('click', () => selectFocus(node.id));
            nameTd.append(btn);
            if ((node.copies || 0) > 1) {
                const copies = document.createElement('span');
                copies.className = 'dep-copies';
                copies.textContent = formatCount(i18n.copies || '×%n', node.copies);
                nameTd.append(copies);
            }
            tr.append(nameTd);
            cells.forEach((text) => {
                const td = document.createElement('td');
                td.textContent = text;
                td.title = text;
                tr.append(td);
            });
            frag.append(tr);
        }

        const bottomSpacer = document.createElement('tr');
        bottomSpacer.className = 'dep-table__spacer';
        const bottomTd = document.createElement('td');
        bottomTd.colSpan = 5;
        bottomTd.style.height = `${Math.max(0, total - end) * TABLE_ROW_H}px`;
        bottomSpacer.append(bottomTd);
        frag.append(bottomSpacer);

        tableBody.replaceChildren(frag);
    };

    const renderTable = (resetScroll = false) => {
        if (!(tableBody instanceof HTMLElement)) {
            return;
        }
        ensureTableScroll();
        const nodes = filteredNodes()
            .slice()
            .sort((a, b) =>
                nodeLabel(a).localeCompare(nodeLabel(b), undefined, { sensitivity: 'base' }),
            );
        const key = filteredKey;
        const changed = key !== tableFilterKey;
        tableFilterKey = key;
        tableRows = nodes;

        if (tableMeta instanceof HTMLElement) {
            const total = (sbom?.nodes || []).length;
            tableMeta.textContent = formatShowing(nodes.length, total);
        }
        if (tableEmpty instanceof HTMLElement) {
            tableEmpty.hidden = nodes.length > 0;
        }
        if (tableWrap instanceof HTMLElement && (resetScroll || changed)) {
            tableWrap.scrollTop = 0;
        }
        paintTableWindow();
    };

    const appendTreeBatch = (wrap, ids, depth, path, offset) => {
        const slice = ids.slice(offset, offset + TREE_BATCH);
        slice.forEach((childId) => {
            if (path.has(childId)) {
                return;
            }
            const child = nodeById.get(childId);
            if (!child) {
                return;
            }
            const childCount = (outgoing.get(childId) || []).length;
            const nextPath = new Set(path);
            nextPath.add(childId);

            if (childCount > 0 && depth < 12) {
                const details = document.createElement('details');
                details.className = 'dep-tree__node' + (focusId === childId ? ' is-active' : '');
                details.dataset.nodeId = String(childId);
                const summary = document.createElement('summary');
                const label = document.createElement('span');
                label.textContent = nodeLabelFull(child);
                const count = document.createElement('span');
                count.className = 'dep-tree__count';
                count.textContent = formatCount(i18n.deps_count || '%n deps', childCount);
                summary.append(label, count);
                summary.addEventListener('click', (event) => {
                    if (event.target !== summary && event.target !== label) {
                        return;
                    }
                    selectFocus(childId);
                });
                details.append(summary);
                details.addEventListener('toggle', () => {
                    if (!details.open || details.dataset.loaded === '1') {
                        return;
                    }
                    details.dataset.loaded = '1';
                    const kids = document.createElement('div');
                    kids.className = 'dep-tree__children';
                    details.append(kids);
                    appendTreeBatch(kids, outgoing.get(childId) || [], depth + 1, nextPath, 0);
                });
                wrap.append(details);
                return;
            }

            const leaf = document.createElement('button');
            leaf.type = 'button';
            leaf.className = 'dep-tree__leaf' + (focusId === childId ? ' is-active' : '');
            leaf.dataset.nodeId = String(childId);
            leaf.textContent = nodeLabelFull(child);
            leaf.addEventListener('click', () => selectFocus(childId));
            wrap.append(leaf);
        });

        const nextOffset = offset + TREE_BATCH;
        if (nextOffset < ids.length) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'btn btn--ghost btn--sm dep-tree__more';
            more.textContent = formatCount(i18n.more_deps || '%n more', ids.length - nextOffset);
            more.addEventListener('click', () => {
                more.remove();
                appendTreeBatch(wrap, ids, depth, path, nextOffset);
            });
            wrap.append(more);
        }
    };

    const renderTree = () => {
        if (!(treeEl instanceof HTMLElement) || !sbom) {
            return;
        }
        treeEl.replaceChildren();
        const needle = (searchInput instanceof HTMLInputElement ? searchInput.value : '')
            .trim()
            .toLowerCase();
        const filtered = filteredNodes();

        const meta = document.createElement('p');
        meta.className = 'dep-tree__meta';
        meta.textContent = formatShowing(filtered.length, (sbom.nodes || []).length);
        treeEl.append(meta);

        if (!filtered.length) {
            const empty = document.createElement('p');
            empty.className = 'dep-empty';
            empty.textContent = i18n.no_results || 'No packages match that search.';
            treeEl.append(empty);
            return;
        }

        if (needle || eco) {
            const title = document.createElement('p');
            title.className = 'dep-tree__title';
            title.textContent = i18n.matches || 'Matching packages';
            treeEl.append(title);
            const wrap = document.createElement('div');
            wrap.className = 'dep-tree__children';
            treeEl.append(wrap);
            const ids = filtered.map((node) => node.id);
            let offset = 0;
            const paintMatches = () => {
                const slice = ids.slice(offset, offset + TREE_BATCH);
                slice.forEach((id) => {
                    const node = nodeById.get(id);
                    if (!node) {
                        return;
                    }
                    const leaf = document.createElement('button');
                    leaf.type = 'button';
                    leaf.className = 'dep-tree__leaf' + (focusId === id ? ' is-active' : '');
                    leaf.dataset.nodeId = String(id);
                    leaf.textContent = nodeLabelFull(node);
                    leaf.addEventListener('click', () => selectFocus(id));
                    wrap.append(leaf);
                });
                offset += TREE_BATCH;
                if (offset < ids.length) {
                    const more = document.createElement('button');
                    more.type = 'button';
                    more.className = 'btn btn--ghost btn--sm dep-tree__more';
                    more.textContent = formatCount(
                        i18n.more_deps || '%n more',
                        ids.length - offset,
                    );
                    more.addEventListener('click', () => {
                        more.remove();
                        paintMatches();
                    });
                    wrap.append(more);
                }
            };
            paintMatches();
            return;
        }

        const rootId = sbom.rootId;
        const manifests =
            Array.isArray(sbom.manifestIds) && sbom.manifestIds.length
                ? sbom.manifestIds
                : rootId !== null && rootId !== undefined
                  ? outgoing.get(rootId) || []
                  : [];

        const title = document.createElement('p');
        title.className = 'dep-tree__title';
        title.textContent = i18n.manifests || 'Manifests';
        treeEl.append(title);

        manifests.forEach((id) => {
            const node = nodeById.get(id);
            if (!node) {
                return;
            }
            const childIds = outgoing.get(id) || [];
            const details = document.createElement('details');
            details.className = 'dep-tree__node' + (focusId === id ? ' is-active' : '');
            details.dataset.nodeId = String(id);
            const summary = document.createElement('summary');
            const label = document.createElement('span');
            label.textContent = nodeLabelFull(node);
            const count = document.createElement('span');
            count.className = 'dep-tree__count';
            count.textContent = formatCount(i18n.deps_count || '%n deps', childIds.length);
            summary.append(label, count);
            summary.addEventListener('click', (event) => {
                if (event.target !== summary && event.target !== label) {
                    return;
                }
                selectFocus(id);
            });
            details.append(summary);
            details.addEventListener('toggle', () => {
                if (!details.open || details.dataset.loaded === '1') {
                    return;
                }
                details.dataset.loaded = '1';
                const kids = document.createElement('div');
                kids.className = 'dep-tree__children';
                details.append(kids);
                const path = new Set(rootId !== null && rootId !== undefined ? [rootId, id] : [id]);
                appendTreeBatch(kids, childIds, 1, path, 0);
            });
            treeEl.append(details);
        });
    };

    const highlightTree = () => {
        if (!(treeEl instanceof HTMLElement)) {
            return;
        }
        treeEl.querySelectorAll('[data-node-id]').forEach((node) => {
            node.classList.toggle(
                'is-active',
                node.getAttribute('data-node-id') === String(focusId),
            );
        });
    };

    const setView = (next) => {
        view = next;
        root.querySelectorAll('[data-dep-view]').forEach((btn) => {
            const active = btn.getAttribute('data-dep-view') === next;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        root.querySelectorAll('[data-dep-panel]').forEach((panel) => {
            const active = panel.getAttribute('data-dep-panel') === next;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
        });
        if (layout instanceof HTMLElement) {
            layout.setAttribute('data-view', next);
        }
        if (next === 'tree') {
            renderTree();
        } else {
            renderTable(true);
        }
    };

    const applySbom = (payload) => {
        sbom = payload;
        eco = '';
        focusId = payload?.rootId ?? null;
        invalidateFilter();
        tableFilterKey = '';
        tableRows = [];
        if (payload) {
            indexGraph(payload);
        } else {
            outgoing = new Map();
            incoming = new Map();
            nodeById = new Map();
        }
        if (layout instanceof HTMLElement) {
            layout.hidden = !payload;
            layout.setAttribute('data-view', view);
        }
        syncLinks();
        renderStats();
        renderEcosystems();
        renderDetail();
        refreshActiveView();
        setStatus(i18n.empty || '', !payload && !(catalog.versions || []).length);
        syncInspector();
    };

    const fillVersionSelect = () => {
        if (!(versionSelect instanceof HTMLSelectElement)) {
            return;
        }
        const current = versionSelect.value || root.getAttribute('data-selected') || '';
        versionSelect.replaceChildren();
        const versions = catalog.versions || [];
        if (!versions.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = i18n.no_sbom || 'No SBOM releases';
            versionSelect.append(option);
            versionSelect.disabled = true;
            return;
        }
        versionSelect.disabled = false;
        versions.forEach((row) => {
            const option = document.createElement('option');
            option.value = row.version;
            option.textContent = row.isPrerelease
                ? `${row.tag} (${i18n.prerelease || 'pre'})`
                : row.tag;
            if (row.version === current || row.tag === current) {
                option.selected = true;
            }
            versionSelect.append(option);
        });
        if (!versionSelect.value && versions[0]) {
            versionSelect.value = versions[0].version;
        }
    };

    const loadVersion = async (version) => {
        if (!version || loading) {
            return;
        }
        loading = true;
        setStatus(i18n.loading || 'Loading…', true);
        if (layout instanceof HTMLElement) {
            layout.classList.add('is-loading');
        }
        try {
            const response = await fetch(`${sbomBase}/${encodeURIComponent(version)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error('sbom fetch failed');
            }
            const payload = await response.json();
            applySbom(payload);
            root.setAttribute('data-selected', payload.version || version);
            syncQuery();
            setStatus('', false);
        } catch {
            applySbom(null);
            setStatus(i18n.error || 'Could not load SBOM.', true);
        } finally {
            loading = false;
            if (layout instanceof HTMLElement) {
                layout.classList.remove('is-loading');
            }
        }
    };

    versionSelect?.addEventListener('change', () => {
        if (versionSelect instanceof HTMLSelectElement) {
            void loadVersion(versionSelect.value);
        }
    });

    searchInput?.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
            invalidateFilter();
            refreshActiveView();
            syncQuery();
        }, 120);
    });

    ecoGroup?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-dep-eco]');
        if (!(btn instanceof HTMLElement)) {
            return;
        }
        eco = btn.getAttribute('data-dep-eco') || '';
        ecoGroup.querySelectorAll('[data-dep-eco]').forEach((node) => {
            node.classList.toggle('is-active', (node.getAttribute('data-dep-eco') || '') === eco);
        });
        invalidateFilter();
        refreshActiveView();
    });

    root.querySelectorAll('[data-dep-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setView(btn.getAttribute('data-dep-view') || 'table');
        });
    });

    detail?.querySelector('[data-dep-detail-close]')?.addEventListener('click', () => {
        selectFocus(sbom?.rootId ?? null);
    });

    detail?.querySelector('[data-dep-detail-purl]')?.addEventListener('click', async (event) => {
        const btn = event.currentTarget;
        if (!(btn instanceof HTMLElement)) {
            return;
        }
        const text = btn.getAttribute('data-copy-text') || '';
        if (!text) {
            return;
        }
        const labels = siteToastCopy();
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            showToast(labels.copy_failed || 'Copy failed');
            return;
        }
        const copied = btn.getAttribute('data-copied-label') || labels.copied || 'Copied';
        const prev = btn.textContent;
        btn.textContent = copied;
        showToast(copied);
        window.setTimeout(() => {
            btn.textContent = prev;
        }, 1400);
    });

    fillVersionSelect();
    const initialQuery = new URL(window.location.href).searchParams.get('q') || '';
    if (searchInput instanceof HTMLInputElement && initialQuery) {
        searchInput.value = initialQuery;
    }
    if (sbom) {
        applySbom(sbom);
        setView('table');
        setStatus('', false);
    } else if ((catalog.versions || []).length) {
        const initial =
            root.getAttribute('data-selected') ||
            catalog.defaultVersion ||
            catalog.versions[0].version;
        void loadVersion(initial).then(() => setView('table'));
    } else {
        setStatus(i18n.empty || '', true);
    }
}

function initPwa() {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
        return;
    }

    const copy = pwaI18n();
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    const activateWaiting = (registration) => {
        const waiting = registration?.waiting;
        if (!waiting || !navigator.serviceWorker.controller) {
            return;
        }
        showPwaToast(copy.updating, { sticky: true });
        waiting.postMessage({ type: 'MCX_SKIP_WAITING' });
    };

    const checkForUpdates = (registration) => {
        if (!registration) {
            return;
        }
        registration
            .update()
            .then(() => activateWaiting(registration))
            .catch(() => {});
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || refreshing) {
            return;
        }
        refreshing = true;
        window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'MCX_SW_ACTIVATED' && hadController) {
            showPwaToast(copy.updating, { sticky: true });
        }
    });

    navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
            activateWaiting(registration);

            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) {
                    return;
                }
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed') {
                        activateWaiting(registration);
                    }
                });
            });

            window.addEventListener('online', () => {
                showPwaToast(copy.online);
                checkForUpdates(registration);
            });

            window.addEventListener('offline', () => {
                showPwaToast(copy.offline);
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    checkForUpdates(registration);
                }
            });

            checkForUpdates(registration);
            window.setInterval(() => checkForUpdates(registration), 5 * 60 * 1000);
        })
        .catch(() => {});
}

function boot() {
    initTheme();
    initMobileMenu();
    initCopyButtons();
    initShowcase();
    initHomeDownloadHint();
    initDownloadChannels();
    initDownloadVersionSelect();
    initDownloadSourceSelect();
    initInterfaceDirectory();
    initLangPicker();
    initSectionReveal();
    initVideoEmbeds();
    initDocs();
    initRoadmapRail();
    initChangelog();
    initOfflineRetry();
    initDependencyViewer();
    initPwa();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
