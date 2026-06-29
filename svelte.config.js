import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    /**
     * Placeholder download `href` values are filled at runtime; ignore invalid-# a11y here.
     */
    warningFilter: (w) => {
      if (w.code === "a11y_invalid_attribute") {
        return false;
      }
      return true;
    },
  },
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build",
      precompress: true,
    }),
    prerender: {
      handleHttpError: "warn",
      handleMissingId: "warn",
      handleUnseenRoutes: "ignore",
      origin: "https://meshchatx.com",
      entries: ["/sitemap.xml", "/robots.txt"],
    },
  },
};

export default config;
