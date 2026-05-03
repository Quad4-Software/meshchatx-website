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
});
