/**
 * Unit tests for static/js/app.js logic that can run in Node.
 * We extract the pure functions and test them independently.
 */
import { describe, expect, it } from "vitest";

// Re-implement the pure functions from app.js for testing
function formatPublishedAgo(
  publishedAt: string | null | undefined,
  nowIso?: string,
  docLang = "en",
) {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  const now = nowIso ? new Date(nowIso) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  let pastSec = (now.getTime() - date.getTime()) / 1000;
  if (pastSec < 0) pastSec = 0;
  if (pastSec < 2) {
    return "published just now";
  }
  const rtf = new Intl.RelativeTimeFormat(docLang, { numeric: "always" });
  const sec = Math.round(pastSec);
  let n;
  let unit: Intl.RelativeTimeFormatUnit;
  if (sec < 60) {
    n = -sec;
    unit = "second";
  } else if (sec < 3600) {
    n = -Math.round(sec / 60);
    unit = "minute";
  } else if (sec < 86400) {
    n = -Math.round(sec / 3600);
    unit = "hour";
  } else if (sec < 2628000) {
    n = -Math.round(sec / 86400);
    unit = "day";
  } else if (sec < 31536000) {
    n = -Math.round(sec / 2628000);
    unit = "month";
  } else {
    n = -Math.round(sec / 31536000);
    unit = "year";
  }
  const agoPart = rtf.format(n, unit);
  return "published " + agoPart;
}

describe("app.js formatPublishedAgo", () => {
  it("returns null for empty input", () => {
    expect(formatPublishedAgo(null)).toBeNull();
    expect(formatPublishedAgo("")).toBeNull();
    expect(formatPublishedAgo(undefined)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(formatPublishedAgo("not-a-date")).toBeNull();
  });

  it("returns just now for very recent", () => {
    const now = "2026-05-04T12:00:00Z";
    expect(formatPublishedAgo("2026-05-04T11:59:59Z", now)).toBe(
      "published just now",
    );
  });

  it("returns seconds ago", () => {
    const now = "2026-05-04T12:00:30Z";
    expect(formatPublishedAgo("2026-05-04T11:59:50Z", now)).toContain(
      "published",
    );
    expect(formatPublishedAgo("2026-05-04T11:59:50Z", now)).toContain("second");
  });

  it("returns minutes ago", () => {
    const now = "2026-05-04T12:05:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now);
    expect(result).toContain("published");
    expect(result).toContain("minute");
  });

  it("returns hours ago", () => {
    const now = "2026-05-04T15:00:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now);
    expect(result).toContain("published");
    expect(result).toContain("hour");
  });

  it("returns days ago", () => {
    const now = "2026-05-07T12:00:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now);
    expect(result).toContain("published");
    expect(result).toContain("day");
  });

  it("returns months ago", () => {
    const now = "2026-08-04T12:00:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now);
    expect(result).toContain("published");
    expect(result).toContain("month");
  });

  it("returns years ago", () => {
    const now = "2028-05-04T12:00:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now);
    expect(result).toContain("published");
    expect(result).toContain("year");
  });

  it("clamps negative time to just now", () => {
    const now = "2026-05-04T12:00:00Z";
    expect(formatPublishedAgo("2026-05-04T12:01:00Z", now)).toBe(
      "published just now",
    );
  });

  it("supports German locale", () => {
    const now = "2026-05-04T15:00:00Z";
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", now, "de");
    expect(result).toContain("published");
    expect(result).toContain("Stunde");
  });
});

describe("app.js benchmark", () => {
  it("formatPublishedAgo handles 10k calls under 500ms", () => {
    const now = "2026-05-04T12:00:00Z";
    const past = "2026-05-04T11:30:00Z";
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      formatPublishedAgo(past, now);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
