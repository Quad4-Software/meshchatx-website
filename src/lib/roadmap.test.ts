import { describe, expect, it } from "vitest";
import { roadmapItemsBase, resolveRoadmapItems } from "./roadmap";

describe("resolveRoadmapItems", () => {
  it("marks roadmap versions as done when published on GitHub", () => {
    const items = resolveRoadmapItems(
      roadmapItemsBase,
      new Set(["4.7.0", "4.6.2"]),
    );
    expect(items[0]?.status).toBe("done");
    expect(items[1]?.status).toBe("planned");
  });

  it("leaves items planned when GitHub has no matching release", () => {
    const items = resolveRoadmapItems(roadmapItemsBase, new Set(["4.6.2"]));
    expect(items[0]?.status).toBe("planned");
  });

  it("does not treat prerelease tags as roadmap milestones", () => {
    const items = resolveRoadmapItems(
      roadmapItemsBase,
      new Set(["4.7.0-rc.6"]),
    );
    expect(items[0]?.status).toBe("planned");
  });
});
