declare global {
  type I18nMessages = Record<string, I18nMessages | string | undefined>;

  interface Window {
    MCX_RELEASES_BUNDLE?: { gitea: unknown[]; github: unknown[] };
    MCX?: {
      initDownloadPage?: () => void | Promise<void>;
      isLikelyPrereleaseRelease?: (release: unknown) => boolean;
      parseRelease?: (release: unknown) => unknown;
      formatRelativeTime?: (publishedAt: string | null | undefined) => string | null;
    };
  }
}
export {};
