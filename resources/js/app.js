import '@fontsource-variable/outfit';
import '@mdi/font/css/materialdesignicons.min.css';

const THEME_KEY = 'theme';

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

function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
        return;
    }

    const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-open', open);
    };

    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        setOpen(open);
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });
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

function shuffleItems(items) {
    const next = items.slice();
    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = next[i];
        next[i] = next[j];
        next[j] = tmp;
    }
    return next;
}

function initCapMarquee() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    document.querySelectorAll('[data-marquee]').forEach((root) => {
        const track = root.querySelector('.cap-marquee__track');
        if (!track) {
            return;
        }

        const pool = Array.from(track.querySelectorAll('.cap-marquee__item'))
            .map((item) => ({
                label: item.textContent.trim(),
                more: item.classList.contains('cap-marquee__item--more'),
            }))
            .filter((item) => item.label);

        if (pool.length === 0) {
            return;
        }

        root.setAttribute('data-marquee-live', '');
        track.replaceChildren();
        track.style.transform = 'translateX(0)';

        let queue = shuffleItems(pool);
        let offset = 0;
        let paused = false;
        let last = performance.now();
        const speed = 38;

        const takeNext = () => {
            if (queue.length === 0) {
                queue = shuffleItems(pool);
            }
            return queue.shift();
        };

        const makeItem = (entry) => {
            const li = document.createElement('li');
            li.className = entry.more
                ? 'cap-marquee__item cap-marquee__item--more'
                : 'cap-marquee__item';
            li.textContent = entry.label;
            return li;
        };

        const fill = () => {
            const target = Math.max(root.clientWidth * 2.4, 480);
            while (track.scrollWidth < target) {
                track.appendChild(makeItem(takeNext()));
            }
        };

        fill();

        root.addEventListener('mouseenter', () => {
            paused = true;
        });
        root.addEventListener('mouseleave', () => {
            paused = false;
        });

        const gapX = () => {
            const styles = window.getComputedStyle(track);
            return Number.parseFloat(styles.columnGap || styles.gap) || 0;
        };

        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            if (!paused && track.firstElementChild) {
                offset += speed * dt;
                const first = track.firstElementChild;
                const step = first.getBoundingClientRect().width + gapX();

                if (step > 0 && offset >= step) {
                    offset -= step;
                    first.remove();
                    track.appendChild(makeItem(takeNext()));
                    fill();
                }

                track.style.transform = `translateX(${-offset}px)`;
            }

            window.requestAnimationFrame(tick);
        };

        window.requestAnimationFrame(tick);
    });
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

        const resolveSrc = (tab) => {
            const src = tab.getAttribute('data-src');
            const srcDark = tab.getAttribute('data-src-dark');
            const isDark = document.documentElement.classList.contains('dark');
            if (srcDark && isDark) {
                return srcDark;
            }
            return src;
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
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ) {
                return;
            }
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(next, delay);
        };

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                stopAutoplay();
                activate(tab);
            });
        });

        const active = tabs.find((tab) => tab.classList.contains('is-active')) || tabs[0];
        activate(active, { animate: false });
        startAutoplay();

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
                }
            });
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

function boot() {
    initTheme();
    initMobileMenu();
    initCopyButtons();
    initCapMarquee();
    initShowcase();
    initDownloadChannels();
    initLangPicker();
    initSectionReveal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
