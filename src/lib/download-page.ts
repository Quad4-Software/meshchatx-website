import type { McxDownloadRow, McxReleasesPayload } from "$lib/github-releases.server";

export type DownloadChannel = "stable" | "prerelease";

export function channelFromSearch(search: string): DownloadChannel {
  return new URLSearchParams(search).get("channel") === "prerelease"
    ? "prerelease"
    : "stable";
}

export function hasReleaseData(payload: McxReleasesPayload): boolean {
  return Boolean(payload.stable?.version || payload.prerelease?.version);
}

export function selectDownloadRelease(
  payload: McxReleasesPayload,
  channel: DownloadChannel,
): { channel: DownloadChannel; release: McxDownloadRow | null } {
  const { stable, prerelease } = payload;
  if (channel === "prerelease" && prerelease) {
    return { channel: "prerelease", release: prerelease };
  }
  if (stable) return { channel: "stable", release: stable };
  if (prerelease) return { channel: "prerelease", release: prerelease };
  return { channel: "stable", release: null };
}

export function linuxOrPre(
  sel: McxDownloadRow | null,
  pre: McxDownloadRow | null,
  field: keyof McxDownloadRow,
): string | null {
  const fromSel = sel?.[field];
  if (typeof fromSel === "string" && fromSel) return fromSel;
  const fromPre = pre?.[field];
  return typeof fromPre === "string" && fromPre ? fromPre : null;
}

export type WheelCmdKind = "pip" | "pipx" | "poetry" | "uv";

export function wheelInstallCmd(kind: WheelCmdKind, wheelUrl: string): string {
  switch (kind) {
    case "pip":
      return `pip install ${wheelUrl}`;
    case "pipx":
      return `pipx install ${wheelUrl}`;
    case "poetry":
      return `poetry add ${wheelUrl}`;
    case "uv":
      return `uv pip install ${wheelUrl}`;
  }
}

export const TERMUX_PIP_CMD = "pip install reticulum-meshchatx";
