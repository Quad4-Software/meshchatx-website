/**
 * CSS layout regression tests.
 * These verify critical selectors exist and have properties that prevent overflow/breakage.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const cssPath = path.join(root, "src/styles/legacy.css");
const css = readFileSync(cssPath, "utf8");

describe("CSS layout regression - critical rules exist", () => {
  it("has overflow-x hidden on html/body to prevent horizontal scroll", () => {
    expect(css).toMatch(
      /html\s*,\s*html\.light\s*\{[\s\S]*?overflow-x:\s*hidden/i,
    );
  });

  it("has box-sizing border-box globally", () => {
    expect(css).toContain("box-sizing: border-box");
    expect(css).toMatch(/\*\s*,\s*\*::before\s*,\s*\*::after/i);
  });

  it("has max-width 100% on showcase images", () => {
    // There are two .mcx-showcase-shot rules; the second one has max-width: 100%
    expect(css).toContain("max-width: 100%");
  });

  it("has word-break on long text elements", () => {
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("word-break: break-all");
  });

  it("has flex-wrap on horizontal button/tab rows", () => {
    expect(css).toContain("flex-wrap: wrap");
  });

  it("has truncate utility for text overflow", () => {
    expect(css).toContain("text-overflow: ellipsis");
    expect(css).toContain("white-space: nowrap");
  });

  it("has responsive padding on containers", () => {
    expect(css).toContain("padding-left: 1.5rem");
    expect(css).toContain("padding-right: 1.5rem");
  });

  it("has mobile breakpoint adjustments", () => {
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (max-width: 380px)");
  });

  it("has min-width: 0 on flex children to allow shrinking", () => {
    expect(css).toContain("min-width: 0");
  });

  it("has hidden utility class", () => {
    expect(css).toContain("display: none !important");
  });

  it("has scroll-margin-top on download sections for anchor offsets", () => {
    expect(css).toContain("scroll-margin-top");
  });
});

describe("CSS layout regression - no dangerous patterns", () => {
  it("does not use 100vw width that causes horizontal overflow", () => {
    const dangerous = css.match(/width\s*:\s*100vw/gi);
    expect(dangerous).toBeNull();
  });

  it("does not use fixed px widths for main containers", () => {
    // Main layout should be fluid; check that .mcx-container uses % or max-width
    expect(css).toContain("width: 100%");
    expect(css).toContain("max-width: var(--max-7xl)");
  });

  it("uses clamp() for hero heading to prevent overflow", () => {
    expect(css).toMatch(/\.mcx-hero h1[\s\S]*?clamp\(/);
  });

  it("has reduced-motion media query for accessibility", () => {
    expect(css).toContain("prefers-reduced-motion");
  });
});
