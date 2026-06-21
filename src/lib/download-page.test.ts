import { describe, expect, it } from "vitest";
import {
  channelFromSearch,
  linuxOrPre,
  selectDownloadRelease,
  wheelInstallCmd,
} from "./download-page";
import type {
  McxDownloadRow,
  McxReleasesPayload,
} from "./github-releases.server";

function row(partial: Partial<McxDownloadRow>): McxDownloadRow {
  return {
    version: "1.0.0",
    releaseUrl: null,
    publishedAt: null,
    isPrerelease: false,
    appImageAmd64Url: null,
    appImageArm64Url: null,
    debAmd64Url: null,
    debArm64Url: null,
    rpmAmd64Url: null,
    wheelUrl: null,
    winInstallerUrl: null,
    winPortableUrl: null,
    macDmgUrl: null,
    apkUrl: null,
    flatpakUrl: null,
    sbomUrl: null,
    ...partial,
  };
}

describe("download-page helpers", () => {
  it("reads channel from search params", () => {
    expect(channelFromSearch("")).toBe("stable");
    expect(channelFromSearch("?channel=prerelease")).toBe("prerelease");
  });

  it("selects prerelease when requested and available", () => {
    const payload: McxReleasesPayload = {
      stable: row({ version: "1.0.0" }),
      prerelease: row({ version: "2.0.0-beta", isPrerelease: true }),
      githubFallbackUrl: "https://example.com/releases",
    };
    const result = selectDownloadRelease(payload, "prerelease");
    expect(result.channel).toBe("prerelease");
    expect(result.release?.version).toBe("2.0.0-beta");
  });

  it("falls back from stable to prerelease when stable missing", () => {
    const payload: McxReleasesPayload = {
      stable: null,
      prerelease: row({ version: "2.0.0-beta", isPrerelease: true }),
      githubFallbackUrl: "https://example.com/releases",
    };
    const result = selectDownloadRelease(payload, "stable");
    expect(result.channel).toBe("prerelease");
    expect(result.release?.version).toBe("2.0.0-beta");
  });

  it("linuxOrPre prefers selected release then prerelease", () => {
    const stable = row({ debAmd64Url: "https://example.com/stable.deb" });
    const pre = row({ debAmd64Url: "https://example.com/pre.deb" });
    expect(linuxOrPre(stable, pre, "debAmd64Url")).toBe(
      "https://example.com/stable.deb",
    );
    expect(linuxOrPre(row({ debAmd64Url: null }), pre, "debAmd64Url")).toBe(
      "https://example.com/pre.deb",
    );
  });

  it("builds wheel install commands", () => {
    const url = "https://example.com/pkg.whl";
    expect(wheelInstallCmd("pip", url)).toBe(`pip install ${url}`);
    expect(wheelInstallCmd("uv", url)).toBe(`uv pip install ${url}`);
  });
});
