declare global {
  type I18nMessages = Record<string, I18nMessages | string | undefined>;

  interface Window {
    MCX_RELEASES_PAYLOAD?: {
      stable: unknown;
      prerelease: unknown;
      githubFallbackUrl: string;
    };
    MCX?: {
      initDownloadPage?: () => void | Promise<void>;
      formatPublishedAgo?: (
        publishedAt: string | null | undefined,
      ) => string | null;
    };
  }
}
export {};
