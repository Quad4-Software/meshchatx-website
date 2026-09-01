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
    const resolved = resolveTheme(preference || 'system');
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    root.dataset.theme = preference || getStoredTheme() || 'system';
    root.style.colorScheme = resolved;

    const meta = document.getElementById('mcx-theme-color');
    if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#fafafa');
    }

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        const next = resolved === 'dark' ? 'light' : 'dark';
        button.setAttribute('aria-label', `Switch to ${next} theme`);
        button.dataset.themeState = resolved;
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

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const current = getStoredTheme() || 'system';
            const resolved = resolveTheme(current);
            const next = resolved === 'dark' ? 'light' : 'dark';
            setStoredTheme(next);
            applyTheme(next);
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

function initCopyButtons() {
    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
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
        }
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

            await copyText(text);

            const label = button.textContent;
            button.classList.add('is-copied');
            button.textContent = button.getAttribute('data-copied-label') || 'Copied';
            window.setTimeout(() => {
                button.classList.remove('is-copied');
                button.textContent = label;
            }, 1600);
        });
    });

    document.querySelectorAll('[data-copy-text]:not([data-copy])').forEach((el) => {
        el.addEventListener('click', async () => {
            const text = el.getAttribute('data-copy-text') || el.textContent.trim();
            if (!text) {
                return;
            }

            await copyText(text);

            el.classList.add('is-copied');
            el.setAttribute('aria-live', 'polite');

            const hint = el.parentElement?.querySelector(
                '.git-card__hint, .contact-panel__hint, .donate-panel__hint',
            );
            const copied = el.getAttribute('data-copied-label') || 'Copied';
            let previousHint = '';

            if (hint) {
                previousHint = hint.textContent;
                hint.textContent = copied;
            }

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

        const startAutoplay = () => {
            if (
                manual ||
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
                if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }
                return;
            }
            startAutoplay();
        });

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
        const initial =
            fromHash?.getAttribute('data-download-tab') ||
            tabs
                .find((tab) => tab.classList.contains('is-active'))
                ?.getAttribute('data-download-tab') ||
            tabs[0]?.getAttribute('data-download-tab');
        if (initial) {
            showPanel(initial, false);
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

function boot() {
    initTheme();
    initMobileMenu();
    initCopyButtons();
    initShowcase();
    initDownloadChannels();
    initInterfaceDirectory();
    initLangPicker();
    initSectionReveal();
    initVideoEmbeds();
    initDocs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
