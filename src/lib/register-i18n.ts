import { addMessages, init } from "svelte-i18n";
import { LOCALES, NESTED } from "./merge-messages";

for (const loc of LOCALES) {
  addMessages(loc, NESTED[loc] as I18nMessages);
}

void init({ fallbackLocale: "en" });
