import { describe, expect, it } from "vitest";
import { showcaseShotUrl, showcaseTabKey } from "./showcase";

describe("showcase helpers", () => {
  it("builds theme-aware asset URLs", () => {
    expect(showcaseShotUrl("/showcase/", 0, true)).toBe(
      "/showcase/dark/tab-11-home.webp",
    );
    expect(showcaseShotUrl("/showcase/", 0, false)).toBe(
      "/showcase/light/tab-11-home.webp",
    );
  });

  it("maps tab indices to i18n keys", () => {
    expect(showcaseTabKey(3)).toBe("js.showcase.tab3");
  });
});
