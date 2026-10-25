// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { generateShotVariants } from './scripts/shot-variants.mjs';

const brand = JSON.parse(
  readFileSync(new URL('./src/config/site.json', import.meta.url), 'utf8'),
);

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
  site: brand.domain,
  output: 'static',
  integrations: [shotVariantsIntegration(), sitemap(), mdx()],

  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
