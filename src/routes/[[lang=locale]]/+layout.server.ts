import type { LayoutServerLoad } from './$types';
import { FLAT, isAppLocale, type AppLocale } from '$lib/merge-messages';

function mcxI18NFromFlat(flat: Record<string, string>) {
  const o: Record<string, string> = {};
  for (const k of Object.keys(flat)) {
    if (k.startsWith('js.')) {
      o[k.slice(3)] = flat[k]!;
    }
  }
  return o;
}

export const load: LayoutServerLoad = async ({ params }) => {
  const raw = params.lang;
  const locale: AppLocale = raw && isAppLocale(raw) ? raw : 'en';
  return {
    locale,
    mcxI18NJson: JSON.stringify(mcxI18NFromFlat(FLAT[locale]))
  };
};

export const prerender = true;
