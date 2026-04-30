import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    /**
     * Placeholder download `href` values are filled at runtime; ignore invalid-# a11y here.
     */
    warningFilter: (w) => {
      if (w.code === 'a11y_invalid_attribute') {
        return false;
      }
      return true;
    }
  },
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      strict: true,
      fallback: undefined
    }),
    prerender: {
      handleHttpError: 'warn',
      handleMissingId: 'warn',
      handleUnseenRoutes: 'ignore',
      origin: 'https://meshchatx.com',
      entries: [
        '/',
        '/download',
        '/contact',
        '/donate',
        '/license',
        '/privacy',
        '/sitemap.xml',
        '/robots.txt',
        '/de/',
        '/de/download',
        '/de/contact',
        '/de/donate',
        '/de/license',
        '/de/privacy',
        '/ru/',
        '/ru/download',
        '/ru/contact',
        '/ru/donate',
        '/ru/license',
        '/ru/privacy',
        '/it/',
        '/it/download',
        '/it/contact',
        '/it/donate',
        '/it/license',
        '/it/privacy'
      ]
    }
  }
};

export default config;
