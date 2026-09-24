import { DEFAULT_LOCALE, PREFIXED_LOCALES, type Locale } from '../config/site';

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
  return value;
}

/** Prefix a path with the locale. English stays unprefixed. */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const base = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return clean ? `${base}/${clean}` : `${base}/`;
}

export { DEFAULT_LOCALE };
