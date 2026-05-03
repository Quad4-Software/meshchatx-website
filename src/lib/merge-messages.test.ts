import { describe, expect, it } from "vitest";
import {
  FLAT,
  isAppLocale,
  mergeLocaleJson,
  mergeJsonObjects,
} from "./merge-messages";

describe("merge-messages", () => {
  it("isAppLocale", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("xx")).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });

  it("mergeLocaleJson flattens strings", () => {
    expect(mergeLocaleJson({ a: { b: "x" } })).toEqual({ "a.b": "x" });
  });

  it("mergeJsonObjects deep merges", () => {
    expect(mergeJsonObjects({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({
      a: { b: 1, c: 2 },
    });
  });

  it("FLAT has expected locales", () => {
    expect(FLAT.en["home.hero.h1"]).toBeDefined();
    expect(FLAT.de["home.hero.h1"]).toBeDefined();
  });
});
