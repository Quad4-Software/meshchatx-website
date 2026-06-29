import { describe, expect, it } from "vitest";
import {
  FLAT,
  isAppLocale,
  LANG_NATIVE_LABELS,
  LOCALES,
  mergeLocaleJson,
  mergeJsonObjects,
  toNestedI18n,
  mergeFallback,
} from "./merge-messages";

describe("merge-messages", () => {
  it("isAppLocale", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("zh")).toBe(true);
    expect(isAppLocale("xx")).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });

  it("mergeLocaleJson flattens strings", () => {
    expect(mergeLocaleJson({ a: { b: "x" } })).toEqual({ "a.b": "x" });
  });

  it("mergeLocaleJson skips non-string leaves", () => {
    expect(mergeLocaleJson({ a: { b: 1, c: "yes" } })).toEqual({
      "a.c": "yes",
    });
  });

  it("mergeJsonObjects deep merges", () => {
    expect(mergeJsonObjects({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({
      a: { b: 1, c: 2 },
    });
  });

  it("mergeJsonObjects overwrites primitives", () => {
    expect(mergeJsonObjects({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it("FLAT has expected locales", () => {
    expect(FLAT.en["home.hero.h1"]).toBeDefined();
    expect(FLAT.de["home.hero.h1"]).toBeDefined();
    expect(FLAT.zh["home.hero.h1"]).toBeDefined();
  });

  it("toNestedI18n reconstructs nested objects", () => {
    const nested = toNestedI18n({ "a.b.c": "deep" });
    expect((nested as Record<string, unknown>).a).toBeDefined();
    expect(nested).toEqual({ a: { b: { c: "deep" } } });
  });

  it("mergeFallback uses local values over English", () => {
    const en = { hello: "Hello", world: "World" };
    const de = { hello: "Hallo", world: "" };
    const merged = mergeFallback(de, en);
    expect(merged.hello).toBe("Hallo");
    expect(merged.world).toBe("World");
  });

  it("LANG_NATIVE_LABELS uses endonyms for every locale", () => {
    expect(LOCALES).toHaveLength(5);
    for (const code of LOCALES) {
      expect(LANG_NATIVE_LABELS[code]).toBeTruthy();
    }
    expect(LANG_NATIVE_LABELS.ru).toBe("Русский");
    expect(LANG_NATIVE_LABELS.zh).toBe("中文");
  });
});

describe("merge-messages benchmarks", () => {
  it("mergeLocaleJson handles 1000 keys under 10ms", () => {
    const big: Record<string, unknown> = {};
    for (let i = 0; i < 1000; i++) {
      big[`page${i}.section${i}.key${i}`] = `value${i}`;
    }
    const start = performance.now();
    mergeLocaleJson(big);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });

  it("mergeJsonObjects deep merge is fast", () => {
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    for (let i = 0; i < 500; i++) {
      a[`k${i}`] = { v: i };
      b[`k${i}`] = { w: i };
    }
    const start = performance.now();
    mergeJsonObjects(a, b);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });

  it("toNestedI18n handles 1000 flat keys under 10ms", () => {
    const flat: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      flat[`a.b.c.d.e${i}`] = `v${i}`;
    }
    const start = performance.now();
    toNestedI18n(flat);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });
});
