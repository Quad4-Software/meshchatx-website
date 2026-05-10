import { LOCALES, type AppLocale } from "./merge-messages";

export const SITE_ORIGIN = "https://meshchatx.com";

/** BCP47 primary subtag for `<html lang>` / SSR shell: first segment de|ru|it|zh, else en. */
export function localeFromPathname(pathname: string): AppLocale {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first === "de" || first === "ru" || first === "it" || first === "zh")
    return first;
  return "en";
}

const NON_EN_LOCALES = new Set(
  LOCALES.filter((l): l is AppLocale => l !== "en"),
);

/**
 * Static hosts that serve `/ru/index.html` style paths: redirect to canonical URLs.
 * Returns null if no redirect applies.
 */
export function redirectPathWithoutIndexHtml(pathname: string): string | null {
  if (!/\/index\.html?$/i.test(pathname)) return null;
  const stripped = pathname.replace(/\/index\.html?$/i, "");
  const base = stripped.replace(/\/+$/, "") || "/";
  if (base === "/") return "/";
  const parts = base.split("/").filter(Boolean);
  if (!parts.length) return "/";
  const first = parts[0]!.toLowerCase();
  if (first === "en") {
    if (parts.length === 1) return "/";
    return "/" + parts.slice(1).join("/");
  }
  if (NON_EN_LOCALES.has(first as AppLocale)) {
    if (parts.length === 1) return `/${first}/`;
    return "/" + [first, ...parts.slice(1)].join("/");
  }
  return "/" + parts.join("/");
}

export type PageId =
  | "home"
  | "download"
  | "contact"
  | "donate"
  | "license"
  | "privacy"
  | "roadmap";

const PAGE_SLUG: Record<Exclude<PageId, "home">, string> = {
  download: "download",
  contact: "contact",
  donate: "donate",
  license: "license",
  privacy: "privacy",
  roadmap: "roadmap",
};

function pageSegment(id: PageId) {
  if (id === "home") {
    return "";
  }
  return PAGE_SLUG[id];
}

function isPageSlug(s: string): s is Exclude<PageId, "home"> {
  return (
    s === "download" ||
    s === "contact" ||
    s === "donate" ||
    s === "license" ||
    s === "privacy" ||
    s === "roadmap"
  );
}

/**
 * Public path for links and the browser (Vite dev + prerendered static).
 * English: `/`, `/download`, `/#features`, `/de/`, `/zh/download#x`
 */
export function appPath(
  loc: AppLocale,
  page: PageId,
  hash: string = "",
): string {
  const h = !hash ? "" : hash.startsWith("#") ? hash : `#${hash}`;
  const seg = pageSegment(page);
  if (loc === "en") {
    const path = seg ? `/${seg}` : "/";
    if (!h) {
      return path;
    }
    if (path === "/") {
      return `/${h}`;
    }
    return `${path}${h}`;
  }
  const path = !seg ? `/${loc}/` : `/${loc}/${seg}`;
  if (!h) {
    return path;
  }
  if (!seg) {
    return `/${loc}/${h}`;
  }
  return `${path}${h}`;
}

export function pageIdFromPathname(path: string) {
  const raw = (path?.split(/[?#]/)[0] ?? path) || "/";
  const p = raw.replace(/\/$/, "") || "/";
  if (p === "/" || p === "") {
    return "home" as const;
  }
  const parts = p
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/\.html$/i, ""));
  if (
    parts[0] === "index" ||
    p.endsWith("/index") ||
    p.endsWith("index.html")
  ) {
    return "home" as const;
  }
  if (
    p.endsWith("de.html") ||
    p.endsWith("ru.html") ||
    p.endsWith("it.html") ||
    p.endsWith("zh.html")
  ) {
    return "home" as const;
  }
  if (parts.length === 1) {
    const a = parts[0]!;
    if (
      a === "de" ||
      a === "ru" ||
      a === "it" ||
      a === "zh" ||
      a === "en" ||
      a === "index"
    ) {
      return "home" as const;
    }
    if (isPageSlug(a)) {
      return a;
    }
    return "home" as const;
  }
  if (parts.length === 2) {
    const [a, b] = parts;
    if (
      (a === "de" || a === "ru" || a === "it" || a === "zh") &&
      isPageSlug(b!)
    ) {
      return b;
    }
  }
  return "home" as const;
}

export function canonicalForLocale(loc: AppLocale, page: PageId) {
  const p = pageSegment(page);
  if (loc === "en") {
    if (p === "") {
      return `${SITE_ORIGIN}/`;
    }
    return `${SITE_ORIGIN}/${p}`;
  }
  if (p === "") {
    return `${SITE_ORIGIN}/${loc}/`;
  }
  return `${SITE_ORIGIN}/${loc}/${p}`;
}

/**
 * Language switcher: same logical page, other locale (root-absolute, works in dev and static).
 */
export function crossLangHref(
  _from: AppLocale,
  to: AppLocale,
  currentPage: PageId,
) {
  return appPath(to, currentPage);
}
