import { describe, it, expect } from "vitest";
import { parseRelease } from "./releases.js";

describe("parseRelease", () => {
    it("returns null for null or missing input", () => {
        expect(parseRelease(null)).toBeNull();
        expect(parseRelease(undefined)).toBeNull();
    });

    it("strips v prefix from tag_name", () => {
        const out = parseRelease({
            tag_name: "v1.2.3",
            html_url: "https://example.com",
            published_at: null,
            prerelease: false,
            assets: []
        });
        expect(out.version).toBe("1.2.3");
    });

    it("sets isPrerelease from release.prerelease", () => {
        expect(parseRelease({ assets: [], prerelease: true }).isPrerelease).toBe(true);
        expect(parseRelease({ assets: [], prerelease: false }).isPrerelease).toBe(false);
    });

    it("picks AppImage AMD64 and ARM64 by name", () => {
        const release = {
            tag_name: "v4.0.0",
            html_url: "",
            published_at: null,
            prerelease: false,
            assets: [
                { name: "MeshChatX-4.0.0-linux-x86_64.AppImage", browser_download_url: "https://a/amd.AppImage" },
                { name: "MeshChatX-4.0.0-linux-arm64.AppImage", browser_download_url: "https://a/arm.AppImage" }
            ]
        };
        const out = parseRelease(release);
        expect(out.appImageAmd64Url).toBe("https://a/amd.AppImage");
        expect(out.appImageArm64Url).toBe("https://a/arm.AppImage");
    });

    it("picks .deb AMD64 and ARM64", () => {
        const release = {
            tag_name: "v4.0.0",
            html_url: "",
            published_at: null,
            prerelease: false,
            assets: [
                { name: "meshchatx_4.0.0_amd64.deb", browser_download_url: "https://a/amd.deb" },
                { name: "meshchatx_4.0.0_arm64.deb", browser_download_url: "https://a/arm.deb" }
            ]
        };
        const out = parseRelease(release);
        expect(out.debAmd64Url).toBe("https://a/amd.deb");
        expect(out.debArm64Url).toBe("https://a/arm.deb");
    });

    it("picks .rpm x86_64", () => {
        const release = {
            tag_name: "v4.0.0",
            html_url: "",
            published_at: null,
            prerelease: false,
            assets: [
                { name: "meshchatx-4.0.0.x86_64.rpm", browser_download_url: "https://a/x64.rpm" }
            ]
        };
        const out = parseRelease(release);
        expect(out.rpmAmd64Url).toBe("https://a/x64.rpm");
    });

    it("picks wheel and Windows installer/portable", () => {
        const release = {
            tag_name: "v4.0.0",
            html_url: "",
            published_at: null,
            prerelease: false,
            assets: [
                { name: "reticulum_meshchatx-4.0.0-py3-none-any.whl", browser_download_url: "https://a/wheel.whl" },
                { name: "MeshChatX-4.0.0-win-installer.exe", browser_download_url: "https://a/installer.exe" },
                { name: "MeshChatX-4.0.0-win-portable.exe", browser_download_url: "https://a/portable.exe" }
            ]
        };
        const out = parseRelease(release);
        expect(out.wheelUrl).toBe("https://a/wheel.whl");
        expect(out.winInstallerUrl).toBe("https://a/installer.exe");
        expect(out.winPortableUrl).toBe("https://a/portable.exe");
    });

    it("uses AppImage fallback when no arch-specific match", () => {
        const release = {
            tag_name: "v4.0.0",
            html_url: "",
            published_at: null,
            prerelease: false,
            assets: [
                { name: "MeshChatX-4.0.0-linux.AppImage", browser_download_url: "https://a/fallback.AppImage" }
            ]
        };
        const out = parseRelease(release);
        expect(out.appImageAmd64Url).toBe("https://a/fallback.AppImage");
        expect(out.appImageArm64Url).toBeNull();
    });
});
