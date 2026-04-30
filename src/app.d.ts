declare global {
  type I18nMessages = Record<string, I18nMessages | string | undefined>;

  interface Window {
    MCX_RELEASES_BUNDLE?: { gitea: unknown[]; github: unknown[] };
  }
}
export {};
