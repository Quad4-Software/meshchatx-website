// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://meshchatx.com',
  output: 'static',
  integrations: [
    sitemap(),
    solidJs(),
  ],

  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
