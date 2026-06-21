import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function readUtf8(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("download page Svelte integration", () => {
  it("DownloadContent reacts to releases payload and URL channel", () => {
    const src = readUtf8("src/lib/DownloadContent.svelte");
    expect(src).toContain("DownloadMeta");
    expect(src).toContain("selectDownloadRelease");
    expect(src).toContain("page.url.search");
    expect(src).not.toContain("window.MCX");
  });

  it("DownloadMeta uses locale-aware pathname for channel links", () => {
    const src = readUtf8("src/lib/DownloadMeta.svelte");
    expect(src).toContain("page.url.pathname");
    expect(src).toContain('?channel=prerelease');
    expect(src).not.toContain("href: '/download?channel=prerelease'");
  });

  it("layout no longer loads legacy app.js", () => {
    const src = readUtf8("src/routes/[[lang=locale]]/+layout.svelte");
    expect(src).not.toContain("app.js");
    expect(src).not.toContain("MCX_I18N");
    expect(src).not.toContain("MCX_RELEASES_PAYLOAD");
  });
});

describe("showcase Svelte component", () => {
  it("Showcase component owns tab state and theme-aware images", () => {
    const src = readUtf8("src/lib/Showcase.svelte");
    expect(src).toContain("showcaseShotUrl");
    expect(src).toContain("theme.isDark");
    expect(src).not.toContain("data-mcx-showcase-bound");
  });

  it("home page passes releases to HomeContent instead of window.MCX init", () => {
    const src = readUtf8("src/routes/[[lang=locale]]/+page.svelte");
    expect(src).toContain("releases={data.releasesPayload}");
    expect(src).not.toContain("window.MCX");
  });
});

describe("reusable client components", () => {
  it("ThemeToggle delegates to theme store", () => {
    const src = readUtf8("src/lib/ThemeToggle.svelte");
    expect(src).toContain("theme.toggle()");
    expect(src).not.toContain("data-theme-toggle");
  });

  it("CopyButton handles clipboard feedback", () => {
    const src = readUtf8("src/lib/CopyButton.svelte");
    expect(src).toContain("navigator.clipboard.writeText");
    expect(src).toContain("#i-check");
  });
});
