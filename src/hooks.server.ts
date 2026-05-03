import type { Handle } from "@sveltejs/kit";
import { localeFromPathname, redirectPathWithoutIndexHtml } from "$lib/paths";

const LANG_PLACEHOLDER = "%mcx.lang%";

export const handle: Handle = async ({ event, resolve }) => {
  const dest = redirectPathWithoutIndexHtml(event.url.pathname);
  if (dest) {
    const u = new URL(dest, event.url.origin);
    u.search = event.url.search;
    return Response.redirect(u.toString(), 308);
  }
  const lang = localeFromPathname(event.url.pathname);
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replaceAll(LANG_PLACEHOLDER, lang),
  });
};
