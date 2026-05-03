import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "MeshChatX",
        short_name: "MeshChatX",
        description: "MeshChatX, Reticulum mesh chat",
        theme_color: "#ffffff",
        background_color: "#09090b",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/logo.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any",
          },
          {
            src: "/favicon.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "any",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: undefined,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/data/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request, sameOrigin, url }) =>
              sameOrigin &&
              request.destination !== "document" &&
              (url.pathname.startsWith("/_app/immutable/") ||
                /\.(?:js|css|woff2?|png|webp|svg|ico|json)$/i.test(
                  url.pathname,
                )),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "meshchatx-static",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
