import '@fontsource-variable/outfit/wght.css';
import Fuse from './vendor/fuse.mjs';

const THEME_KEY = 'theme';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DESKTOP_NAV = '(min-width: 1024px)';

let setMobileNavOpen = () => {};

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
        if (!trigger || !id) {
            return;
        }

        const title = trigger.getAttribute('aria-label') || 'YouTube video';

        trigger.addEventListener(
            'click',
            () => {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
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
        const image = root.querySelector('[data-showcase-image]');
        const caption = root.querySelector('[data-showcase-caption]');
        if (!tabs.length || !image) {
            return;
        }

        let manual = false;
        let timer = null;
        let busy = false;
        const delay = Number(root.getAttribute('data-showcase-autoplay') || 0);
        const fadeMs = 520;
        const prefetched = new Set();

        const resolveSrc = (tab) => {
            const src = tab.getAttribute('data-src');
            const srcDark = tab.getAttribute('data-src-dark');
            const isDark = document.documentElement.classList.contains('dark');
            if (srcDark && isDark) {
                return srcDark;
            }
            return src;
        };

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

            const nextSrc = resolveSrc(tab);
            prefetchAdjacent(tab);
            const label = tab.getAttribute('data-label') || tab.textContent.trim();
            const applyMeta = () => {
                if (label) {
                    image.setAttribute('alt', label);
                    if (caption) {
                        caption.textContent = label;
                    }
                }
            };

            if (!nextSrc || image.getAttribute('src') === nextSrc) {
                applyMeta();
                return;
            }

            const swap = () => {
                image.setAttribute('src', nextSrc);
                applyMeta();
                image.classList.remove('is-fading');
                busy = false;
            };

            if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                swap();
                return;
            }

            busy = true;
            image.classList.add('is-fading');
            window.setTimeout(() => {
                const onLoad = () => {
                    image.removeEventListener('load', onLoad);
                    window.requestAnimationFrame(() => {
                        image.classList.remove('is-fading');
                        busy = false;
                    });
                };
                image.addEventListener('load', onLoad);
                image.setAttribute('src', nextSrc);
                applyMeta();
                window.setTimeout(() => {
                    if (busy) {
                        image.removeEventListener('load', onLoad);
                        image.classList.remove('is-fading');
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

        const observer = new MutationObserver(() => {
            const current = tabs.find((tab) => tab.classList.contains('is-active')) || tabs[0];
            activate(current, { animate: false });
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
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
    const url = typeof meta?.url === 'string' && meta.url !== '' ? meta.url : `#${platformId}`;
    const cta = formatDownloadCta(template, label);
    const isExternal = /^https?:\/\//i.test(url);
    const isAsset = isExternal && platformId !== 'umbrel';

    btn.href = url;
    btn.hidden = false;
    if (isAsset) {
        btn.setAttribute('download', '');
    } else {
        btn.removeAttribute('download');
    }
    if (isExternal && platformId === 'umbrel') {
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
    } else {
        btn.removeAttribute('target');
        btn.removeAttribute('rel');
    }
    if (labelNode) {
        labelNode.textContent = cta;
    } else {
        btn.textContent = cta;
    }
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
            const any = Array.from(group.querySelectorAll('[data-ifx-card]')).some(
                (card) => !card.hidden,
            );
            group.hidden = !any;
        });

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
            a.href = item.href;
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
        tipLink.href = node.getAttribute('data-preview-href') || '#';
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
                /^\s*(javascript|data|vbscript):/i.test(value)
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
    const catalogUrl = root.getAttribute('data-catalog-url') || '/api/mcx-sbom';
    const sbomBase = root.getAttribute('data-sbom-base') || '/api/mcx-sbom';
    const logoUrl = root.getAttribute('data-logo') || '/logo.webp';

    const versionSelect = root.querySelector('[data-dep-version]');
    const searchInput = root.querySelector('[data-dep-search]');
    const ecoGroup = root.querySelector('[data-dep-ecosystems]');
    const statusEl = root.querySelector('[data-dep-status]');
    const layout = root.querySelector('[data-dep-layout]');
    const listEl = root.querySelector('[data-dep-list]');
    const listMeta = root.querySelector('[data-dep-list-meta]');
    const statsEl = root.querySelector('[data-dep-stats]');
    const graphSvg = root.querySelector('[data-dep-graph]');
    const graphWrap = root.querySelector('[data-dep-graph-wrap]');
    const graphHint = root.querySelector('[data-dep-graph-hint]');
    const resetBtn = root.querySelector('[data-dep-reset]');
    const treeEl = root.querySelector('[data-dep-tree]');
    const tableBody = root.querySelector('[data-dep-table]');
    const detail = root.querySelector('[data-dep-detail]');
    const detailLogo = root.querySelector('[data-dep-detail-logo]');
    const downloadLink = root.querySelector('[data-dep-download]');
    const releaseLink = root.querySelector('[data-dep-release]');
    const toggleListBtns = root.querySelectorAll('[data-dep-toggle-list]');
    const rail = root.querySelector('[data-dep-rail]');

    let catalog = parseJsonScript(root, '[data-dep-catalog]', {
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
    let simTimer = 0;
    let loading = false;
    let listOpen = true;

    const nodeLabel = (node) => node?.label || node?.name || '';

    const isAppNode = (node) =>
        Boolean(node?.logo || node?.kind === 'app' || node?.id === sbom?.rootId);

    const isManifestNode = (node) =>
        Boolean(node?.kind === 'manifest' || (sbom?.manifestIds || []).includes(node?.id));

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

    const syncPanels = () => {
        if (rail instanceof HTMLElement) {
            rail.hidden = !listOpen;
        }
        if (layout instanceof HTMLElement) {
            layout.classList.toggle('is-list-open', listOpen);
            layout.classList.toggle(
                'is-inspector-open',
                detail instanceof HTMLElement && !detail.hidden,
            );
        }
        toggleListBtns.forEach((btn) => {
            btn.setAttribute('aria-pressed', listOpen ? 'true' : 'false');
            btn.classList.toggle('is-active', listOpen);
        });
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
        return (sbom.nodes || []).filter((node) => {
            if (eco && node.ecosystem !== eco) {
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
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(needle);
        });
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
        const licStat = root.querySelector('[data-dep-stat-licenses]');
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
        if (licStat) {
            licStat.textContent = topEntries(sbom.stats?.licenses || {}, 4)
                .map(([k, v]) => `${k} ${v}`)
                .join(' · ');
        }
    };

    const syncLinks = () => {
        if (downloadLink instanceof HTMLAnchorElement) {
            if (sbom?.sourceUrl) {
                downloadLink.href = sbom.sourceUrl;
                downloadLink.hidden = false;
                downloadLink.setAttribute('download', '');
            } else {
                downloadLink.hidden = true;
            }
        }
        if (releaseLink instanceof HTMLAnchorElement) {
            if (sbom?.releaseUrl) {
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
        const atRoot = id === null || id === sbom?.rootId;
        if (resetBtn instanceof HTMLElement) {
            resetBtn.hidden = atRoot;
        }
        renderList();
        renderGraph();
        renderDetail();
        renderTable();
        if (treeEl instanceof HTMLElement && view === 'tree') {
            highlightTree();
        }
        syncPanels();
    };

    const renderDetail = () => {
        if (!(detail instanceof HTMLElement)) {
            return;
        }
        const node = focusId !== null ? nodeById.get(focusId) : null;
        if (!node || focusId === sbom?.rootId) {
            detail.hidden = true;
            syncPanels();
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
        setText('[data-dep-detail-eco]', node.ecosystem);
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
                btn.textContent = target.version
                    ? `${nodeLabel(target)}@${target.version}`
                    : nodeLabel(target);
                btn.addEventListener('click', () => selectFocus(id));
                li.append(btn);
                ul.append(li);
            });
        };

        fillList('[data-dep-detail-deps]', outgoing.get(node.id) || []);
        fillList('[data-dep-detail-used]', incoming.get(node.id) || []);
        syncPanels();
    };

    const renderList = () => {
        if (!(listEl instanceof HTMLElement)) {
            return;
        }
        const nodes = filteredNodes();
        const limit = 160;
        const slice = nodes.slice(0, limit);
        if (listMeta instanceof HTMLElement) {
            listMeta.textContent = formatShowing(slice.length, nodes.length);
        }
        listEl.replaceChildren();
        slice.forEach((node) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dep-list__item' + (focusId === node.id ? ' is-active' : '');
            btn.setAttribute('role', 'option');
            btn.setAttribute('aria-selected', focusId === node.id ? 'true' : 'false');

            if (isAppNode(node)) {
                const img = document.createElement('img');
                img.className = 'dep-list__mark';
                img.src = logoUrl;
                img.alt = '';
                img.width = 18;
                img.height = 18;
                img.decoding = 'async';
                btn.append(img);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'dep-list__mark--spacer';
                spacer.setAttribute('aria-hidden', 'true');
                btn.append(spacer);
            }

            const name = document.createElement('span');
            name.className = 'dep-list__name';
            name.textContent = nodeLabel(node);
            btn.append(name);
            if (node.version) {
                const ver = document.createElement('span');
                ver.className = 'dep-list__ver';
                ver.textContent = node.version;
                btn.append(ver);
            }
            if (node.ecosystem || isManifestNode(node)) {
                const badge = document.createElement('span');
                badge.className = 'dep-list__eco';
                badge.textContent = node.ecosystem || node.kind || '';
                btn.append(badge);
            }
            btn.addEventListener('click', () => selectFocus(node.id));
            li.append(btn);
            listEl.append(li);
        });
    };

    const renderTable = () => {
        if (!(tableBody instanceof HTMLElement)) {
            return;
        }
        const nodes = filteredNodes().slice(0, 250);
        tableBody.replaceChildren();
        nodes.forEach((node) => {
            const tr = document.createElement('tr');
            if (focusId === node.id) {
                tr.classList.add('is-active');
            }
            const cells = [
                nodeLabel(node),
                node.version || '-',
                node.ecosystem || '-',
                node.license || i18n.unknown_license || '-',
                node.type || '-',
            ];
            cells.forEach((text, index) => {
                const td = document.createElement('td');
                if (index === 0) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'dep-link';
                    btn.textContent = text;
                    btn.addEventListener('click', () => selectFocus(node.id));
                    td.append(btn);
                } else {
                    td.textContent = text;
                }
                tr.append(td);
            });
            tableBody.append(tr);
        });
    };

    const renderTree = () => {
        if (!(treeEl instanceof HTMLElement) || !sbom) {
            return;
        }
        treeEl.replaceChildren();
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

        const buildBranch = (id, depth, path) => {
            if (path.has(id) || depth > 4) {
                return null;
            }
            const node = nodeById.get(id);
            if (!node) {
                return null;
            }
            const nextPath = new Set(path);
            nextPath.add(id);
            const details = document.createElement(depth === 0 ? 'div' : 'details');
            if (depth > 0) {
                details.open = depth < 2;
            }
            details.className = 'dep-tree__node' + (focusId === id ? ' is-active' : '');
            details.dataset.nodeId = String(id);

            const label = document.createElement(depth === 0 ? 'button' : 'summary');
            if (depth === 0) {
                label.type = 'button';
                label.className = 'dep-tree__manifest';
            }
            label.textContent = node.version
                ? `${nodeLabel(node)}@${node.version}`
                : nodeLabel(node);
            label.addEventListener('click', (event) => {
                if (depth > 0 && event.target !== label) {
                    return;
                }
                selectFocus(id);
            });
            details.append(label);

            const children = (outgoing.get(id) || []).slice(0, depth === 0 ? 48 : 28);
            if (children.length && depth < 4) {
                const wrap = document.createElement('div');
                wrap.className = 'dep-tree__children';
                children.forEach((childId) => {
                    const child = buildBranch(childId, depth + 1, nextPath);
                    if (child) {
                        wrap.append(child);
                    }
                });
                details.append(wrap);
            }
            return details;
        };

        manifests.forEach((id) => {
            const branch = buildBranch(id, 0, new Set(rootId !== null ? [rootId] : []));
            if (branch) {
                treeEl.append(branch);
            }
        });
    };

    const highlightTree = () => {
        if (!(treeEl instanceof HTMLElement)) {
            return;
        }
        treeEl.querySelectorAll('.dep-tree__node').forEach((node) => {
            node.classList.toggle(
                'is-active',
                node.getAttribute('data-node-id') === String(focusId),
            );
        });
    };

    const graphSize = () => {
        const rect = graphWrap?.getBoundingClientRect();
        const width = Math.max(640, Math.floor(rect?.width || 960));
        const height = Math.max(420, Math.floor(rect?.height || 560));
        return { width, height };
    };

    const graphNodesForFocus = () => {
        if (!sbom) {
            return { nodes: [], links: [] };
        }
        const ids = new Set();
        const links = [];
        if (focusId === null || focusId === sbom.rootId) {
            const rootId = sbom.rootId;
            if (rootId !== null && rootId !== undefined) {
                ids.add(rootId);
            }
            (sbom.manifestIds || []).forEach((id) => ids.add(id));
            (sbom.manifestIds || []).slice(0, 10).forEach((mid) => {
                (outgoing.get(mid) || []).slice(0, 14).forEach((id) => ids.add(id));
            });
            if (ids.size < 8) {
                filteredNodes()
                    .slice(0, 40)
                    .forEach((node) => ids.add(node.id));
            }
        } else {
            ids.add(focusId);
            (outgoing.get(focusId) || []).forEach((id) => ids.add(id));
            (incoming.get(focusId) || []).forEach((id) => ids.add(id));
            (outgoing.get(focusId) || []).slice(0, 16).forEach((id) => {
                (outgoing.get(id) || []).slice(0, 5).forEach((child) => ids.add(child));
            });
        }

        (sbom.edges || []).forEach(([from, to]) => {
            if (ids.has(from) && ids.has(to)) {
                links.push({ source: from, target: to });
            }
        });

        return {
            nodes: [...ids].map((id) => nodeById.get(id)).filter(Boolean),
            links,
        };
    };

    const renderGraph = () => {
        if (!(graphSvg instanceof SVGElement) || !sbom) {
            return;
        }
        window.clearTimeout(simTimer);
        const { width, height } = graphSize();
        graphSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        graphSvg.setAttribute('width', String(width));
        graphSvg.setAttribute('height', String(height));

        const { nodes, links } = graphNodesForFocus();
        if (graphHint instanceof HTMLElement) {
            const focusNode = focusId !== null ? nodeById.get(focusId) : null;
            graphHint.textContent = focusNode
                ? `${nodeLabel(focusNode)}${focusNode.version ? '@' + focusNode.version : ''}`
                : i18n.focus_hint || '';
        }

        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;
        const positions = new Map();
        nodes.forEach((node, index) => {
            const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const ring =
                node.id === focusId || node.id === sbom.rootId
                    ? 0
                    : baseRadius + (index % 6) * Math.max(18, baseRadius * 0.08);
            positions.set(node.id, {
                x: cx + Math.cos(angle) * ring,
                y: cy + Math.sin(angle) * ring,
                vx: 0,
                vy: 0,
            });
        });

        const draw = () => {
            while (graphSvg.firstChild) {
                graphSvg.removeChild(graphSvg.firstChild);
            }
            const ns = 'http://www.w3.org/2000/svg';
            const gLinks = document.createElementNS(ns, 'g');
            gLinks.setAttribute('class', 'dep-graph__links');
            links.forEach((link) => {
                const a = positions.get(link.source);
                const b = positions.get(link.target);
                if (!a || !b) {
                    return;
                }
                const line = document.createElementNS(ns, 'line');
                line.setAttribute('x1', String(a.x));
                line.setAttribute('y1', String(a.y));
                line.setAttribute('x2', String(b.x));
                line.setAttribute('y2', String(b.y));
                line.setAttribute('class', 'dep-graph__edge');
                gLinks.append(line);
            });
            graphSvg.append(gLinks);

            const gNodes = document.createElementNS(ns, 'g');
            gNodes.setAttribute('class', 'dep-graph__nodes');
            nodes.forEach((node) => {
                const pos = positions.get(node.id);
                if (!pos) {
                    return;
                }
                const group = document.createElementNS(ns, 'g');
                group.setAttribute(
                    'class',
                    'dep-graph__node' + (node.id === focusId ? ' is-focus' : ''),
                );
                group.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
                group.style.cursor = 'pointer';
                group.addEventListener('click', () => selectFocus(node.id));

                const app = isAppNode(node);
                const manifest = isManifestNode(node);
                const radius = app ? 22 : manifest ? 14 : 9;

                if (app) {
                    const ring = document.createElementNS(ns, 'circle');
                    ring.setAttribute('r', String(radius + 4));
                    ring.setAttribute('class', 'dep-graph__logo-ring');
                    group.append(ring);

                    const clipId = `dep-clip-${node.id}`;
                    const defs = document.createElementNS(ns, 'defs');
                    const clip = document.createElementNS(ns, 'clipPath');
                    clip.setAttribute('id', clipId);
                    const clipCircle = document.createElementNS(ns, 'circle');
                    clipCircle.setAttribute('r', String(radius));
                    clip.append(clipCircle);
                    defs.append(clip);
                    group.append(defs);

                    const image = document.createElementNS(ns, 'image');
                    image.setAttribute('href', logoUrl);
                    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', logoUrl);
                    image.setAttribute('x', String(-radius));
                    image.setAttribute('y', String(-radius));
                    image.setAttribute('width', String(radius * 2));
                    image.setAttribute('height', String(radius * 2));
                    image.setAttribute('clip-path', `url(#${clipId})`);
                    image.setAttribute('class', 'dep-graph__logo');
                    group.append(image);
                } else {
                    const circle = document.createElementNS(ns, 'circle');
                    circle.setAttribute('r', String(radius));
                    circle.setAttribute(
                        'class',
                        'dep-graph__dot' +
                            (manifest ? ' is-manifest' : '') +
                            (node.ecosystem === 'npm' ? ' is-npm' : '') +
                            (node.ecosystem === 'pypi' ? ' is-pypi' : ''),
                    );
                    group.append(circle);
                }

                const label = document.createElementNS(ns, 'text');
                label.setAttribute('class', 'dep-graph__label');
                label.setAttribute('y', String(radius + 16));
                label.setAttribute('text-anchor', 'middle');
                const raw = nodeLabel(node);
                label.textContent = raw.length > 26 ? raw.slice(0, 24) + '…' : raw;
                group.append(label);

                if (node.version && !app) {
                    const sub = document.createElementNS(ns, 'text');
                    sub.setAttribute('class', 'dep-graph__label dep-graph__label--sub');
                    sub.setAttribute('y', String(radius + 28));
                    sub.setAttribute('text-anchor', 'middle');
                    sub.textContent = node.version;
                    group.append(sub);
                }

                gNodes.append(group);
            });
            graphSvg.append(gNodes);
        };

        const tick = () => {
            const repel = Math.max(2800, width * height * 0.004);
            const linkLen = Math.max(100, Math.min(width, height) * 0.16);
            for (let step = 0; step < 22; step++) {
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const a = positions.get(nodes[i].id);
                        const b = positions.get(nodes[j].id);
                        let dx = a.x - b.x;
                        let dy = a.y - b.y;
                        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = repel / (dist * dist);
                        dx = (dx / dist) * force;
                        dy = (dy / dist) * force;
                        a.vx += dx;
                        a.vy += dy;
                        b.vx -= dx;
                        b.vy -= dy;
                    }
                }
                links.forEach((link) => {
                    const a = positions.get(link.source);
                    const b = positions.get(link.target);
                    let dx = b.x - a.x;
                    let dy = b.y - a.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - linkLen) * 0.025;
                    dx = (dx / dist) * force;
                    dy = (dy / dist) * force;
                    a.vx += dx;
                    a.vy += dy;
                    b.vx -= dx;
                    b.vy -= dy;
                });
                nodes.forEach((node) => {
                    const p = positions.get(node.id);
                    p.vx += (cx - p.x) * 0.005;
                    p.vy += (cy - p.y) * 0.005;
                    p.vx *= 0.74;
                    p.vy *= 0.74;
                    p.x = Math.max(48, Math.min(width - 48, p.x + p.vx));
                    p.y = Math.max(48, Math.min(height - 48, p.y + p.vy));
                });
            }
            draw();
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            draw();
            return;
        }
        let frames = 0;
        const run = () => {
            tick();
            frames += 1;
            if (frames < 14) {
                simTimer = window.setTimeout(run, 28);
            }
        };
        run();
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
        if (next === 'tree') {
            renderTree();
        }
        if (next === 'table') {
            renderTable();
        }
        if (next === 'graph') {
            window.requestAnimationFrame(() => renderGraph());
        }
    };

    const applySbom = (payload) => {
        sbom = payload;
        eco = '';
        focusId = payload?.rootId ?? null;
        if (payload) {
            indexGraph(payload);
        } else {
            outgoing = new Map();
            incoming = new Map();
            nodeById = new Map();
        }
        if (layout instanceof HTMLElement) {
            layout.hidden = !payload;
        }
        syncLinks();
        renderStats();
        renderEcosystems();
        renderList();
        renderDetail();
        renderTable();
        renderTree();
        window.requestAnimationFrame(() => renderGraph());
        setStatus(i18n.empty || '', !payload && !(catalog.versions || []).length);
        syncPanels();
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

    const warmCaches = () => {
        const versions = (catalog.versions || []).filter((row) => !row.cached).slice(0, 12);
        let index = 0;
        const next = () => {
            if (index >= versions.length) {
                fetch(`${catalogUrl}?warm=1`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }).catch(() => {});
                return;
            }
            const row = versions[index];
            index += 1;
            fetch(`${sbomBase}/${encodeURIComponent(row.version)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            })
                .catch(() => {})
                .finally(() => {
                    window.setTimeout(next, 400);
                });
        };
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => next(), { timeout: 4000 });
        } else {
            window.setTimeout(next, 1500);
        }
    };

    versionSelect?.addEventListener('change', () => {
        if (versionSelect instanceof HTMLSelectElement) {
            void loadVersion(versionSelect.value);
        }
    });

    searchInput?.addEventListener('input', () => {
        renderList();
        renderTable();
        if (focusId === null || focusId === sbom?.rootId) {
            renderGraph();
        }
        syncQuery();
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
        renderList();
        renderTable();
    });

    root.querySelectorAll('[data-dep-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setView(btn.getAttribute('data-dep-view') || 'table');
        });
    });

    toggleListBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            listOpen = !listOpen;
            syncPanels();
        });
    });

    root.querySelectorAll('[data-dep-toggle-inspector]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!(detail instanceof HTMLElement)) {
                return;
            }
            if (detail.hidden) {
                selectFocus(focusId || sbom?.rootId || null);
            } else {
                detail.hidden = true;
                syncPanels();
            }
        });
    });

    resetBtn?.addEventListener('click', () => {
        selectFocus(sbom?.rootId ?? null);
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

    if (graphWrap && 'ResizeObserver' in window) {
        let resizeTimer = 0;
        const observer = new ResizeObserver(() => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                if (view === 'graph' && sbom) {
                    renderGraph();
                }
            }, 80);
        });
        observer.observe(graphWrap);
    }

    window.addEventListener('resize', () => {
        if (view === 'graph' && sbom) {
            window.requestAnimationFrame(() => renderGraph());
        }
    });

    fillVersionSelect();
    const initialQuery = new URL(window.location.href).searchParams.get('q') || '';
    if (searchInput instanceof HTMLInputElement && initialQuery) {
        searchInput.value = initialQuery;
    }
    syncPanels();
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

    warmCaches();
}

function initPwa() {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
        return;
    }

    const copy = pwaI18n();
    let pendingReload = false;
    let refreshing = false;

    const checkForUpdates = (registration) => {
        registration?.update().catch(() => {});
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!pendingReload || refreshing) {
            return;
        }
        refreshing = true;
        window.location.reload();
    });

    navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
            if (registration.waiting && navigator.serviceWorker.controller) {
                pendingReload = true;
                showPwaToast(copy.updating, { sticky: true });
                registration.waiting.postMessage({ type: 'MCX_SKIP_WAITING' });
            }

            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) {
                    return;
                }
                worker.addEventListener('statechange', () => {
                    if (worker.state !== 'installed' || !navigator.serviceWorker.controller) {
                        return;
                    }
                    pendingReload = true;
                    showPwaToast(copy.updating, { sticky: true });
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
