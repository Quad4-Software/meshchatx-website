import { getCollection, type CollectionEntry } from 'astro:content';
import { DOCS_GROUPS, DOCS_DEFAULT_SLUG, type Locale } from '../config/site';

export type DocEntry = CollectionEntry<'docs'>;

/** Slug for a doc entry, stripped of its locale dir prefix. */
export function docSlug(entry: DocEntry): { locale: string; slug: string } {
  const parts = entry.id.split('/');
  const first = parts[0] ?? '';
  if (parts.length > 1) {
    return { locale: first, slug: parts.slice(1).join('/') };
  }
  return { locale: 'en', slug: first };
}

export async function getDocs(): Promise<DocEntry[]> {
  return getCollection('docs');
}

export async function getDoc(locale: Locale, slug: string): Promise<DocEntry | null> {
  const all = await getDocs();
  return (
    all.find((e) => {
      const s = docSlug(e);
      return s.locale === locale && s.slug === slug;
    }) ??
    all.find((e) => {
      const s = docSlug(e);
      return s.locale === 'en' && s.slug === slug;
    }) ??
    null
  );
}

export interface DocsNavItem {
  slug: string;
  title: string;
}

export interface DocsNavGroup {
  labelKey: string;
  items: DocsNavItem[];
}

export async function docsNav(locale: Locale): Promise<DocsNavGroup[]> {
  const all = await getDocs();
  const bySlug = new Map<string, DocEntry>();
  const bySlugEn = new Map<string, DocEntry>();
  for (const e of all) {
    const s = docSlug(e);
    if (s.locale === locale) bySlug.set(s.slug, e);
    if (s.locale === 'en') bySlugEn.set(s.slug, e);
  }
  const groups: DocsNavGroup[] = [];
  for (const g of DOCS_GROUPS) {
    const items: DocsNavItem[] = [];
    for (const slug of g.items) {
      const entry = bySlug.get(slug) ?? bySlugEn.get(slug);
      if (entry) items.push({ slug, title: entry.data.title });
    }
    if (items.length > 0) groups.push({ labelKey: g.labelKey, items });
  }
  return groups;
}

export async function allDocSlugs(): Promise<string[]> {
  const all = await getDocs();
  return all.map((e) => docSlug(e).slug);
}

export { DOCS_DEFAULT_SLUG };
