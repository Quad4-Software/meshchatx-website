// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { generateShotVariants } from './scripts/shot-variants.mjs';

function shotVariantsIntegration() {
  return {
    name: 'mcx-shot-variants',
    hooks: {
      'astro:config:setup': async () => {
        await generateShotVariants();
      },
    },
  };
}

export default defineConfig({
  site: 'https://meshchatx.com',
  output: 'static',
  integrations: [shotVariantsIntegration(), sitemap()],

  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
