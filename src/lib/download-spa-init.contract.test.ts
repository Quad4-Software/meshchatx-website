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

describe("download SPA release init", () => {
  it("download +page re-runs MCX init when URL changes ($effect + page.url)", () => {
    const src = readUtf8("src/routes/[[lang=locale]]/download/+page.svelte");
    expect(src).toMatch(/\$effect\b/);
    expect(src).toMatch(/\bbrowser\b/);
    expect(src).toMatch(/\bpage\.url\.(pathname|search)\b/);
    expect(src).toMatch(/window\.MCX\?\.initDownloadPage\?\.\(/);
    expect(src).not.toMatch(/\bonMount\b/);
  });

  it("app.js exposes initDownloadPage on window.MCX for the page to invoke", () => {
    const src = readUtf8("static/js/app.js");
    expect(src).toContain("window.MCX.initDownloadPage = initDownloadPage");
  });

  it("app.js does not gate initDownloadPage only on boot data-page download", () => {
    const src = readUtf8("static/js/app.js");
    expect(src).not.toContain(
      "if (document.body.getAttribute('data-page') === 'download')",
    );
  });

  it("channel toggle links use current pathname (locale-aware), not hardcoded /download", () => {
    const src = readUtf8("static/js/app.js");
    expect(src).toContain("location.pathname");
    expect(src).toContain('pathOnly + "?channel=prerelease" + locHash');
    expect(src).not.toContain("href: '/download?channel=prerelease'");
    expect(src).not.toContain("href: '/download'");
  });

  it("copy buttons stay idempotent when initDownloadPage runs after navigation", () => {
    const src = readUtf8("static/js/app.js");
    expect(src).toContain("data-mcx-copy-bound");
  });

  it("initDownloadPage ignores stale async completions when channel changes quickly", () => {
    const src = readUtf8("static/js/app.js");
    expect(src).toContain("mcxDownloadInitSeq");
    expect(src).toContain("if (seq !== mcxDownloadInitSeq) return");
  });
});
