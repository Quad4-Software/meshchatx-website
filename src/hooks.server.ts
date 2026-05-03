import type { Handle } from "@sveltejs/kit";
import { localeFromPathname } from "$lib/paths";

const LANG_PLACEHOLDER = "%mcx.lang%";

export const handle: Handle = async ({ event, resolve }) => {
  const lang = localeFromPathname(event.url.pathname);
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replaceAll(LANG_PLACEHOLDER, lang),
  });
};
