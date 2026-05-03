import type { ReleaseRecord } from "./releases-fetch.server";

export function isLikelyPrereleaseRelease(release: unknown): boolean {
  if (!release || typeof release !== "object") return false;
  const r = release as Record<string, unknown>;
  if (/-(rc|alpha|beta|pre)/i.test(String(r.tag_name ?? ""))) return true;
  if (r.prerelease === true) return true;
  if (r.prerelease === false) return false;
  return false;
}

export function publishedOnly(list: ReleaseRecord[]): ReleaseRecord[] {
  return list.filter((r) => !r.draft);
}

export function sortPublishedDesc(a: ReleaseRecord, b: ReleaseRecord): number {
  return (
    new Date(String(b.published_at ?? 0)).getTime() -
    new Date(String(a.published_at ?? 0)).getTime()
  );
}

export function pickStableRelease(
  giteaList: ReleaseRecord[],
  githubList: ReleaseRecord[],
): ReleaseRecord | null {
  const gp = publishedOnly(giteaList);
  const s = gp.find((r) => r && !isLikelyPrereleaseRelease(r));
  if (s) return s;
  const hp = publishedOnly(githubList);
  return hp.find((r) => r && !isLikelyPrereleaseRelease(r)) ?? null;
}

export function pickPrereleaseRelease(
  giteaList: ReleaseRecord[],
  githubList: ReleaseRecord[],
): ReleaseRecord | null {
  const hp = publishedOnly(githubList).filter(isLikelyPrereleaseRelease);
  hp.sort(sortPublishedDesc);
  if (hp.length) return hp[0]!;
  const gp = publishedOnly(giteaList).filter(isLikelyPrereleaseRelease);
  gp.sort(sortPublishedDesc);
  return gp.length ? gp[0]! : null;
}
