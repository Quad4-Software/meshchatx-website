import type { Handle } from "@sveltejs/kit";
import { localeFromPathname, redirectPathWithoutIndexHtml } from "$lib/paths";

const LANG_PLACEHOLDER = "%mcx.lang%";

function applyCacheHeaders(pathname: string, response: Response): void {
  const headers = response.headers;
  if (pathname.startsWith("/_app/immutable/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }
  if (
    pathname.startsWith("/static/") ||
    /\.(?:css|js|webp|png|svg|ico|woff2?)$/i.test(pathname)
  ) {
    headers.set("Cache-Control", "public, max-age=86400");
    return;
  }
  const type = headers.get("content-type") ?? "";
  if (type.includes("text/html")) {
    headers.set("Cache-Control", "no-store");
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const dest = redirectPathWithoutIndexHtml(event.url.pathname);
  if (dest) {
    const u = new URL(dest, event.url.origin);
    u.search = event.url.search;
    return Response.redirect(u.toString(), 308);
  }
  const lang = localeFromPathname(event.url.pathname);
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replaceAll(LANG_PLACEHOLDER, lang),
  });
  applyCacheHeaders(event.url.pathname, response);
  return response;
};
