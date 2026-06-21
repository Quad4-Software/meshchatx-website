import { browser } from "$app/environment";

function readIsDark(): boolean {
  if (!browser) return true;
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function syncThemeColorMeta(isDark: boolean): void {
  if (!browser) return;
  const meta = document.getElementById("mcx-theme-color");
  meta?.setAttribute("content", isDark ? "#09090b" : "#ffffff");
}

class ThemeStore {
  isDark = $state(readIsDark());

  syncFromDom(): void {
    this.isDark = readIsDark();
    syncThemeColorMeta(this.isDark);
  }

  toggle(): void {
    if (!browser) return;
    const root = document.documentElement;
    root.classList.add("mcx-theme-switching");
    const wantDark = !readIsDark();
    root.classList.remove("dark", "light");
    if (wantDark) {
      root.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {
        /* ignore */
      }
    } else {
      root.classList.add("light");
      try {
        localStorage.setItem("theme", "light");
      } catch {
        /* ignore */
      }
    }
    this.isDark = wantDark;
    syncThemeColorMeta(wantDark);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove("mcx-theme-switching");
      });
    });
  }
}

export const theme = new ThemeStore();

if (browser) {
  theme.syncFromDom();
}
