import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import globals from "globals";
import svelte from "eslint-plugin-svelte";
import svelteConfig from "./svelte.config.js";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "build/**",
      ".svelte-kit/**",
      "node_modules/**",
      "static/data/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
  },
  {
    files: ["**/*.svelte"],
    rules: {
      "svelte/no-navigation-without-resolve": "off",
      "svelte/no-at-html-tags": "off",
    },
  },
  {
    files: ["static/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  prettier,
  ...svelte.configs.prettier,
);
