export const SHOWCASE_TAB_COUNT = 12;

export const SHOWCASE_TAB_FILES = [
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
] as const;

export function showcaseTabKey(index: number): string {
  return `js.showcase.tab${index}`;
}

export function showcaseShotUrl(
  assetsBase: string,
  tabIndex: number,
  isDark: boolean,
): string {
  const base = assetsBase.endsWith("/") ? assetsBase : `${assetsBase}/`;
  const sub = isDark ? "dark/" : "light/";
  const file = SHOWCASE_TAB_FILES[tabIndex] ?? SHOWCASE_TAB_FILES[0];
  return `${base}${sub}${file}`;
}
