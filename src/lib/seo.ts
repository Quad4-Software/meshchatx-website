import { LOCALES, type AppLocale } from "$lib/merge-messages";
import { canonicalForLocale, SITE_ORIGIN, type PageId } from "$lib/paths";
const SITEMAP_PAGE_ORDER: PageId[] = [
  "home",
  "download",
  "roadmap",
  "contact",
  "donate",
  "license",
  "privacy",
];

const PAGE_BREADCRUMB: Record<Exclude<PageId, "home">, string> = {
  download: "Download",
  contact: "Contact",
  donate: "Donate",
  license: "License",
  privacy: "Privacy",
  roadmap: "Roadmap",
};

function hreflangForPage(page: PageId): [string, string][] {
  return LOCALES.map(
    (l) => [l, canonicalForLocale(l, page)] as [string, string],
  );
}

export function buildSitemapXml() {
  const unique = new Map<
    string,
    { loc: string; hreflang: [string, string][] }
  >();
  for (const page of SITEMAP_PAGE_ORDER) {
    const hi = hreflangForPage(page);
    for (const [, u] of hi) {
      unique.set(u, { loc: u, hreflang: hi });
    }
  }
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const e of unique.values()) {
    lines.push("  <url>", `    <loc>${escXml(e.loc)}</loc>`);
    for (const [code, href] of e.hreflang) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${escXml(code)}" href="${escXml(href)}" />`,
      );
    }
    lines.push(
      '    <xhtml:link rel="alternate" hreflang="x-default" href="' +
        escXml(e.hreflang[0][1]) +
        '" />',
      "  </url>",
    );
  }
  lines.push("</urlset>");
  return lines.join("\n") + "\n";
}

function escXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ISO6391: Record<AppLocale, string> = {
  en: "en",
  de: "de",
  ru: "ru",
  it: "it",
  zh: "zh",
};

export function buildPageJsonLd(opts: {
  page: PageId;
  loc: AppLocale;
  title: string;
  description: string;
  brand: string;
  logoUrl: string;
  pageUrl: string;
}) {
  const orgId = `${SITE_ORIGIN}/#organization`;
  const siteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${opts.pageUrl}#webpage`;
  const g: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: opts.brand,
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: opts.logoUrl,
        caption: opts.brand,
      },
    },
    {
      "@type": "WebSite",
      "@id": siteId,
      name: opts.brand,
      url: SITE_ORIGIN,
      inLanguage: [...LOCALES],
      publisher: { "@id": orgId },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      name: opts.title,
      url: opts.pageUrl,
      description: opts.description,
      isPartOf: { "@id": siteId },
      inLanguage: ISO6391[opts.loc],
      isFamilyFriendly: true,
    },
  ];
  if (opts.page !== "home") {
    g.push(
      breadcrumbList({
        page: opts.page,
        pageUrl: opts.pageUrl,
        homeUrl: canonicalForLocale(opts.loc, "home"),
      }),
    );
  }
  return {
    "@context": "https://schema.org",
    "@graph": g,
  };
}

function breadcrumbList(opts: {
  page: Exclude<PageId, "home">;
  pageUrl: string;
  homeUrl: string;
}) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${opts.pageUrl}#breadcrumbs`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: opts.homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: PAGE_BREADCRUMB[opts.page],
        item: opts.pageUrl,
      },
    ],
  };
}

export function buildRobotsTxt() {
  return (
    `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml

# Security contact: ${SITE_ORIGIN}/.well-known/security.txt
`.trim() + "\n"
  );
}
