import type { LayoutServerLoad } from "./$types";
import { getMcxReleasesPayload } from "$lib/github-releases.server";
import { isAppLocale, type AppLocale } from "$lib/merge-messages";

export const load: LayoutServerLoad = async ({ params }) => {
  const raw = params.lang;
  const locale: AppLocale = raw && isAppLocale(raw) ? raw : "en";
  const releasesPayload = await getMcxReleasesPayload();
  return {
    locale,
    releasesPayload,
  };
};

export const prerender = false;
