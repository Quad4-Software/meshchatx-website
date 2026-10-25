import { CONTACT, DEFAULT_LOCALE, DONATE, PREFIXED_LOCALES, SITE, type Locale } from '../config/site';

type Dict = Record<string, unknown>;

const modules = import.meta.glob<Dict>('./locales/*.json', { eager: true, import: 'default' });

const catalogs = new Map<Locale, Dict>();

for (const locale of ['en', ...PREFIXED_LOCALES] as Locale[]) {
  const merged: Dict = {};
  const main = modules[`./locales/${locale}.json`] ?? {};
  const dl = modules[`./locales/${locale}.download.json`] ?? {};
  deepMerge(merged, main);
  deepMerge(merged, dl);
  catalogs.set(locale, merged);
}

function deepMerge(target: Dict, src: Dict) {
  for (const [k, v] of Object.entries(src)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const t = (target[k] ?? {}) as Dict;
      target[k] = t;
      deepMerge(t, v as Dict);
    } else {
      target[k] = v;
    }
  }
}

const en = catalogs.get('en') ?? {};

// Tokens available in locale strings: {app} -> SITE.name, {author} ->
// SITE.authorName, {key} -> any string field of SITE/CONTACT/DONATE,
// {h:key} -> that URL's host, {up:key} -> that URL without scheme.
const TOKENS: Record<string, string> = {};
for (const src of [SITE, CONTACT, DONATE] as const) {
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'string') TOKENS[k] = v;
  }
}
TOKENS.app = SITE.name;
TOKENS.author = SITE.authorName;

function tokenHost(key: string): string | undefined {
  const v = TOKENS[key];
  if (!v) return undefined;
  try {
    return new URL(v).host;
  } catch {
    return undefined;
  }
}

function tokenBare(key: string): string | undefined {
  const v = TOKENS[key];
  if (!v) return undefined;
  return v.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function substitute(value: string): string {
  return value
    .replace(/\{h:([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, k: string) => tokenHost(k) ?? m)
    .replace(/\{up:([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, k: string) => tokenBare(k) ?? m)
    .replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, k: string) => TOKENS[k] ?? m);
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Dict)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Translate a dotted key for a locale, falling back to English. */
export function t(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
  const dict = catalogs.get(locale) ?? en;
  let value = lookup(dict, key) ?? lookup(en, key) ?? key;
  for (const [name, raw] of Object.entries(vars)) {
    value = value.replaceAll(`:${name}`, String(raw));
    value = value.replaceAll(`%${name}`, String(raw));
    if (name === 's') value = value.replace('%s', String(raw));
    if (name === 'n') value = value.replace('%n', String(raw));
  }
  return substitute(value);
}

/** Translate, falling back to a raw value when the key is missing. */
export function tOr(locale: Locale, key: string, fallback: string): string {
  const dict = catalogs.get(locale) ?? en;
  return substitute(lookup(dict, key) ?? lookup(en, key) ?? fallback);
}

/** Prefix a path with the locale. English stays unprefixed. */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const base = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return clean ? `${base}/${clean}` : `${base}/`;
}

export { DEFAULT_LOCALE };
