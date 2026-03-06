import { describe, it, expect } from "vitest";
import { site } from "./config.js";

describe("config", () => {
    it("exports site with name and url", () => {
        expect(site.name).toBe("MeshChatX");
        expect(site.url).toBe("https://meshchatx.quad4.io");
    });

    it("has non-empty description", () => {
        expect(typeof site.description).toBe("string");
        expect(site.description.length).toBeGreaterThan(0);
    });

    it("has repo link", () => {
        expect(site.repo).toBe("https://git.quad4.io/RNS-Things/MeshChatX");
    });
});
