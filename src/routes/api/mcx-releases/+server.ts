import { json, type RequestHandler } from "@sveltejs/kit";
import { getMcxReleasesPayload } from "$lib/bunny-releases.server";

/** Fresh Bunny-derived release index (same data as SSR embed). For debugging and client refetch when embed is empty. */
export const GET: RequestHandler = async () => {
  const payload = await getMcxReleasesPayload();
  return json(payload, {
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  });
};
