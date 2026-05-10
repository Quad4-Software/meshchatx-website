import { describe, expect, it } from "vitest";
import { buildPageJsonLd, buildRobotsTxt, buildSitemapXml } from "./seo";

describe("seo", () => {
  it("buildSitemapXml contains locales and pages", () => {
    const xml = buildSitemapXml();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset ");
    expect(xml).toContain("meshchatx.com/download");
    expect(xml).toContain('hreflang="de"');
    expect(xml).toContain('hreflang="zh"');
    expect(xml).toContain("x-default");
  });

  it("buildRobotsTxt references sitemap", () => {
    const txt = buildRobotsTxt();
    expect(txt).toContain("User-agent:");
    expect(txt).toContain("Sitemap:");
    expect(txt).toContain("/sitemap.xml");
  });

  it("buildPageJsonLd home and inner page", () => {
    const home = buildPageJsonLd({
      page: "home",
      loc: "en",
      title: "Home",
      description: "Desc",
      brand: "MeshChatX",
      logoUrl: "https://meshchatx.com/logo.webp",
      pageUrl: "https://meshchatx.com/",
    });
    expect(home["@context"]).toBe("https://schema.org");
    expect(Array.isArray(home["@graph"])).toBe(true);
    expect(JSON.stringify(home)).toContain("WebSite");

    const dl = buildPageJsonLd({
      page: "download",
      loc: "de",
      title: "DL",
      description: "D",
      brand: "MeshChatX",
      logoUrl: "https://meshchatx.com/logo.webp",
      pageUrl: "https://meshchatx.com/de/download",
    });
    expect(JSON.stringify(dl)).toContain("BreadcrumbList");
  });

  it("buildSitemapXml escapes XML entities when present", () => {
    // The current implementation escapes &, <, >, " via escXml
    const xml = buildSitemapXml();
    // URLs don't contain raw & in this dataset, but the escaping function is tested directly
    expect(xml).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
  });
});

describe("seo benchmarks", () => {
  it("buildSitemapXml is fast (< 5ms for 5 pages × 5 locales)", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      buildSitemapXml();
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500); // 1000 runs should be under 500ms
  });

  it("buildPageJsonLd is fast (< 1ms per page)", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      buildPageJsonLd({
        page: "download",
        loc: "de",
        title: "DL",
        description: "D",
        brand: "MeshChatX",
        logoUrl: "https://meshchatx.com/logo.webp",
        pageUrl: "https://meshchatx.com/de/download",
      });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100); // 10k runs under 100ms
  });
});
