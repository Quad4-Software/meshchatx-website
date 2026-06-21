import type { PageServerLoad } from "./$types";
import { getPublishedReleaseVersions } from "$lib/github-releases.server";
import { roadmapItemsBase, resolveRoadmapItems } from "$lib/roadmap";

export const load: PageServerLoad = async () => {
  const publishedVersions = await getPublishedReleaseVersions();
  const roadmapItems = resolveRoadmapItems(roadmapItemsBase, publishedVersions);
  return { roadmapItems };
};
