declare global {
  type I18nMessages = Record<string, I18nMessages | string | undefined>;
}

export {};
