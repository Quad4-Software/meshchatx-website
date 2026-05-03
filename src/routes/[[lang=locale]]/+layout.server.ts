import type { LayoutServerLoad } from "./$types";
import { FLAT, isAppLocale, type AppLocale } from "$lib/merge-messages";
import { getReleasesBundle } from "$lib/releases-fetch.server";

function mcxI18NFromFlat(flat: Record<string, string>) {
  const o: Record<string, string> = {};
  for (const k of Object.keys(flat)) {
    if (k.startsWith("js.")) {
      o[k.slice(3)] = flat[k]!;
    }
  }
  return o;
}

export const load: LayoutServerLoad = async ({ params }) => {
  const raw = params.lang;
  const locale: AppLocale = raw && isAppLocale(raw) ? raw : "en";
  const releasesBundle = await getReleasesBundle();
  const releasesBundleLiteral = JSON.stringify(releasesBundle).replace(
    /</g,
    "\\u003c",
  );
  return {
    locale,
    mcxI18NJson: JSON.stringify(mcxI18NFromFlat(FLAT[locale])),
    releasesBundleLiteral,
  };
};

export const prerender = false;
