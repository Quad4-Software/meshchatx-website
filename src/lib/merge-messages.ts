import deDownload from "../../i18n/de.download.json" with { type: "json" };
import de from "../../i18n/de.json" with { type: "json" };
import enDownload from "../../i18n/en.download.json" with { type: "json" };
import en from "../../i18n/en.json" with { type: "json" };
import itDownload from "../../i18n/it.download.json" with { type: "json" };
import it from "../../i18n/it.json" with { type: "json" };
import ruDownload from "../../i18n/ru.download.json" with { type: "json" };
import ru from "../../i18n/ru.json" with { type: "json" };
import zhDownload from "../../i18n/zh.download.json" with { type: "json" };
import zh from "../../i18n/zh.json" with { type: "json" };

export type AppLocale = "en" | "de" | "ru" | "it" | "zh";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function isRecord(x: unknown): x is Record<string, Json> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function flattenJson(prefix: string, v: unknown, out: Record<string, string>) {
  if (isRecord(v)) {
    for (const [k, v2] of Object.entries(v)) {
      const nk = prefix ? `${prefix}.${k}` : k;
      flattenJson(nk, v2, out);
    }
  } else if (typeof v === "string" && prefix) {
    out[prefix] = v;
  }
}

function mergeLocaleJson(raw: unknown) {
  const out: Record<string, string> = {};
  flattenJson("", raw, out);
  return out;
}

function deepMerge(a: unknown, b: unknown): unknown {
  if (b == null) {
    return a;
  }
  if (a == null) {
    return b;
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b)
  ) {
    return b;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const out: Record<string, unknown> = { ...ao };
  for (const k of Object.keys(bo)) {
    const av = ao[k];
    const bv = bo[k]!;
    if (isRecord(av) && isRecord(bv as unknown)) {
      out[k] = deepMerge(av, bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

function mergeJsonObjects(...parts: unknown[]) {
  if (parts.length === 0) {
    return {};
  }
  let o: unknown = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    o = deepMerge(o, parts[i]!);
  }
  return o;
}

function mergeFallback(
  loc: Record<string, string>,
  enMap: Record<string, string>,
) {
  const out = { ...enMap };
  for (const k of Object.keys(loc)) {
    const v = loc[k]!;
    if (v !== "") {
      out[k] = v;
    }
  }
  return out;
}

function toNestedI18n(flat: Record<string, string>) {
  const out: I18nMessages = {};
  for (const k of Object.keys(flat)) {
    const v = flat[k]!;
    const segs = k.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = out;
    for (let i = 0; i < segs.length - 1; i++) {
      const s = segs[i]!;
      if (!cur[s]) {
        cur[s] = {};
      }
      cur = cur[s] as I18nMessages;
    }
    const last = segs[segs.length - 1] as string;
    cur[last] = v;
  }
  return out as I18nMessages;
}

const enFromFiles = mergeLocaleJson(mergeJsonObjects(en, enDownload));
const deFromFiles = mergeLocaleJson(mergeJsonObjects(de, deDownload));
const ruFromFiles = mergeLocaleJson(mergeJsonObjects(ru, ruDownload));
const itFromFiles = mergeLocaleJson(mergeJsonObjects(it, itDownload));
const zhFromFiles = mergeLocaleJson(mergeJsonObjects(zh, zhDownload));

const deFlat = mergeFallback(deFromFiles, enFromFiles);
const ruFlat = mergeFallback(ruFromFiles, enFromFiles);
const itFlat = mergeFallback(itFromFiles, enFromFiles);
const zhFlat = mergeFallback(zhFromFiles, enFromFiles);

const NESTED: Record<AppLocale, I18nMessages> = {
  en: toNestedI18n(enFromFiles),
  de: toNestedI18n(deFlat),
  ru: toNestedI18n(ruFlat),
  it: toNestedI18n(itFlat),
  zh: toNestedI18n(zhFlat),
};

const FLAT: Record<AppLocale, Record<string, string>> = {
  en: enFromFiles,
  de: deFlat,
  ru: ruFlat,
  it: itFlat,
  zh: zhFlat,
};

export {
  FLAT,
  NESTED,
  mergeFallback,
  mergeLocaleJson,
  toNestedI18n,
  mergeJsonObjects,
};

export function isAppLocale(s: string | undefined): s is AppLocale {
  return s === "en" || s === "de" || s === "ru" || s === "it" || s === "zh";
}

export const LOCALES: AppLocale[] = ["en", "de", "ru", "it", "zh"];

/** Endonym shown in the language picker (always in that language). */
export const LANG_NATIVE_LABELS: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  it: "Italiano",
  zh: "中文",
};

export function langNativeLabel(locale: AppLocale): string {
  return LANG_NATIVE_LABELS[locale];
}
