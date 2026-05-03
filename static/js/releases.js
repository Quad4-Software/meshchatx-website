(function () {
  "use strict";

  function formatRelativeTime(publishedAt) {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    const now = new Date();
    const locale = document.documentElement.lang || "en";
    const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
    const diffHour = Math.round(diffSec / 3600);
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
    const diffDay = Math.round(diffSec / 86400);
    if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
    const diffWeek = Math.round(diffSec / 604800);
    if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week");
    const diffMonth = Math.round(diffSec / 2628000);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
    const diffYear = Math.round(diffSec / 31536000);
    return rtf.format(diffYear, "year");
  }

  window.MCX = {
    formatRelativeTime,
  };
})();
