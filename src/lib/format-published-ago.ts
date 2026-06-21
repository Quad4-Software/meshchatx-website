export type PublishedAgoLabels = {
  justNow: string;
  prefix: string;
};

export function formatPublishedAgo(
  publishedAt: string | null | undefined,
  labels: PublishedAgoLabels,
  opts?: { now?: Date; locale?: string },
): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  const now = opts?.now ?? new Date();
  if (Number.isNaN(date.getTime())) return null;
  const locale = opts?.locale ?? "en";
  let pastSec = (now.getTime() - date.getTime()) / 1000;
  if (pastSec < 0) pastSec = 0;
  if (pastSec < 2) return labels.justNow;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  const sec = Math.round(pastSec);
  let n: number;
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
  return `${labels.prefix} ${rtf.format(n, unit)}`;
}
