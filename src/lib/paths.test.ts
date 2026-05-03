import { describe, expect, it } from "vitest";
import {
  appPath,
  canonicalForLocale,
  crossLangHref,
  localeFromPathname,
  pageIdFromPathname,
  redirectPathWithoutIndexHtml,
  SITE_ORIGIN,
} from "./paths";

describe("paths", () => {
  it("appPath en home and download", () => {
    expect(appPath("en", "home")).toBe("/");
    expect(appPath("en", "download")).toBe("/download");
    expect(appPath("en", "download", "linux")).toBe("/download#linux");
    expect(appPath("en", "home", "features")).toBe("/#features");
  });

  it("appPath localized", () => {
    expect(appPath("de", "home")).toBe("/de/");
    expect(appPath("de", "download")).toBe("/de/download");
    expect(appPath("de", "download", "macos")).toBe("/de/download#macos");
    expect(appPath("zh", "home")).toBe("/zh/");
    expect(appPath("zh", "download")).toBe("/zh/download");
  });

  it("canonicalForLocale", () => {
    expect(canonicalForLocale("en", "home")).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalForLocale("en", "download")).toBe(
      `${SITE_ORIGIN}/download`,
    );
    expect(canonicalForLocale("de", "home")).toBe(`${SITE_ORIGIN}/de/`);
    expect(canonicalForLocale("de", "download")).toBe(
      `${SITE_ORIGIN}/de/download`,
    );
    expect(canonicalForLocale("zh", "home")).toBe(`${SITE_ORIGIN}/zh/`);
  });

  it("pageIdFromPathname", () => {
    expect(pageIdFromPathname("/")).toBe("home");
    expect(pageIdFromPathname("/download")).toBe("download");
    expect(pageIdFromPathname("/de/")).toBe("home");
    expect(pageIdFromPathname("/de/download")).toBe("download");
    expect(pageIdFromPathname("/contact")).toBe("contact");
    expect(pageIdFromPathname("/download.html")).toBe("download");
    expect(pageIdFromPathname("/de.html")).toBe("home");
    expect(pageIdFromPathname("/zh.html")).toBe("home");
    expect(pageIdFromPathname("/zh/download")).toBe("download");
    expect(pageIdFromPathname("/privacy?q=1")).toBe("privacy");
  });

  it("crossLangHref", () => {
    expect(crossLangHref("en", "de", "download")).toBe("/de/download");
  });

  it("localeFromPathname", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/download")).toBe("en");
    expect(localeFromPathname("/de/")).toBe("de");
    expect(localeFromPathname("/de/download")).toBe("de");
    expect(localeFromPathname("/ru/contact")).toBe("ru");
    expect(localeFromPathname("/it/")).toBe("it");
    expect(localeFromPathname("/zh/contact")).toBe("zh");
    expect(localeFromPathname("/sitemap.xml")).toBe("en");
  });

  it("redirectPathWithoutIndexHtml", () => {
    expect(redirectPathWithoutIndexHtml("/download")).toBeNull();
    expect(redirectPathWithoutIndexHtml("/index.html")).toBe("/");
    expect(redirectPathWithoutIndexHtml("/INDEX.HTML")).toBe("/");
    expect(redirectPathWithoutIndexHtml("/download/index.html")).toBe(
      "/download",
    );
    expect(redirectPathWithoutIndexHtml("/ru/index.html")).toBe("/ru/");
    expect(redirectPathWithoutIndexHtml("/RU/index.html")).toBe("/ru/");
    expect(redirectPathWithoutIndexHtml("/ru/download/index.html")).toBe(
      "/ru/download",
    );
    expect(redirectPathWithoutIndexHtml("/en/index.html")).toBe("/");
    expect(redirectPathWithoutIndexHtml("/en/download/index.html")).toBe(
      "/download",
    );
    expect(redirectPathWithoutIndexHtml("/zh/contact/index.htm")).toBe(
      "/zh/contact",
    );
  });
});
