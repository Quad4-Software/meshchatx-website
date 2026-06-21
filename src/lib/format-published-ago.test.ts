import { describe, expect, it } from "vitest";
import { formatPublishedAgo } from "./format-published-ago";

const LABELS = {
  justNow: "published just now",
  prefix: "published",
};

describe("formatPublishedAgo", () => {
  it("returns null for empty input", () => {
    expect(formatPublishedAgo(null, LABELS)).toBeNull();
    expect(formatPublishedAgo("", LABELS)).toBeNull();
    expect(formatPublishedAgo(undefined, LABELS)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(formatPublishedAgo("not-a-date", LABELS)).toBeNull();
  });

  it("returns just now for very recent", () => {
    const now = new Date("2026-05-04T12:00:00Z");
    expect(formatPublishedAgo("2026-05-04T11:59:59Z", LABELS, { now })).toBe(
      "published just now",
    );
  });

  it("returns seconds ago", () => {
    const now = new Date("2026-05-04T12:00:30Z");
    const result = formatPublishedAgo("2026-05-04T11:59:50Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("second");
  });

  it("returns minutes ago", () => {
    const now = new Date("2026-05-04T12:05:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("minute");
  });

  it("returns hours ago", () => {
    const now = new Date("2026-05-04T15:00:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("hour");
  });

  it("returns days ago", () => {
    const now = new Date("2026-05-07T12:00:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("day");
  });

  it("returns months ago", () => {
    const now = new Date("2026-08-04T12:00:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("month");
  });

  it("returns years ago", () => {
    const now = new Date("2028-05-04T12:00:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, { now });
    expect(result).toContain("published");
    expect(result).toContain("year");
  });

  it("clamps negative time to just now", () => {
    const now = new Date("2026-05-04T12:00:00Z");
    expect(formatPublishedAgo("2026-05-04T12:01:00Z", LABELS, { now })).toBe(
      "published just now",
    );
  });

  it("supports German locale", () => {
    const now = new Date("2026-05-04T15:00:00Z");
    const result = formatPublishedAgo("2026-05-04T12:00:00Z", LABELS, {
      now,
      locale: "de",
    });
    expect(result).toContain("published");
    expect(result).toContain("Stunde");
  });
});

describe("formatPublishedAgo benchmark", () => {
  it("handles 10k calls under 500ms", () => {
    const now = new Date("2026-05-04T12:00:00Z");
    const past = "2026-05-04T11:30:00Z";
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      formatPublishedAgo(past, LABELS, { now });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
