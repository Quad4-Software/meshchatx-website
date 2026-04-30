import { describe, expect, it } from 'vitest';
import type { ReleaseRecord } from './releases-fetch.server';
import {
  isLikelyPrereleaseRelease,
  pickPrereleaseRelease,
  pickStableRelease,
  publishedOnly,
  sortPublishedDesc,
} from './releases-pick';

function rel(partial: Partial<ReleaseRecord> & { tag_name: string }): ReleaseRecord {
  return { draft: false, ...partial } as ReleaseRecord;
}

describe('releases-pick', () => {
  it('isLikelyPrereleaseRelease', () => {
    expect(isLikelyPrereleaseRelease(null)).toBe(false);
    expect(isLikelyPrereleaseRelease(rel({ tag_name: 'v1.0.0', prerelease: false }))).toBe(false);
    expect(isLikelyPrereleaseRelease(rel({ tag_name: 'v1.0.0-rc.1', prerelease: false }))).toBe(true);
    expect(isLikelyPrereleaseRelease(rel({ tag_name: 'v1.0.0', prerelease: true }))).toBe(true);
  });

  it('publishedOnly skips drafts', () => {
    expect(publishedOnly([rel({ tag_name: 'a', draft: true }), rel({ tag_name: 'b' })])).toHaveLength(1);
  });

  it('sortPublishedDesc orders newest first', () => {
    const a = rel({ tag_name: 'v1', published_at: '2020-01-01T00:00:00Z' });
    const b = rel({ tag_name: 'v2', published_at: '2021-01-01T00:00:00Z' });
    expect(sortPublishedDesc(a, b)).toBeGreaterThan(0);
  });

  it('pickStableRelease prefers gitea non-prerelease', () => {
    const stable = rel({ tag_name: 'v4.5.1', prerelease: false });
    const pre = rel({ tag_name: 'v5-rc.1', prerelease: true });
    expect(pickStableRelease([stable], [pre])).toEqual(stable);
  });

  it('pickStableRelease falls back to github', () => {
    const gh = rel({ tag_name: 'v2.0.0', prerelease: false });
    expect(pickStableRelease([], [gh])).toEqual(gh);
  });

  it('pickPrereleaseRelease prefers github prerelease', () => {
    const giteaStable = rel({ tag_name: 'v4.5.1', prerelease: false });
    const ghPre = rel({
      tag_name: 'v5.0.0-rc.1',
      prerelease: true,
      published_at: '2026-01-02T00:00:00Z',
    });
    const ghPreOld = rel({
      tag_name: 'v5.0.0-beta.1',
      prerelease: true,
      published_at: '2026-01-01T00:00:00Z',
    });
    expect(pickPrereleaseRelease([giteaStable], [ghPreOld, ghPre])).toEqual(ghPre);
  });

  it('pickPrereleaseRelease falls back to gitea', () => {
    const pre = rel({ tag_name: 'v1-rc.1', prerelease: true });
    expect(pickPrereleaseRelease([pre], [])).toEqual(pre);
  });
});
