import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const isTest = process.env.VITEST === "true";
export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    resolve: {
        conditions: isTest ? ["browser", "import", "module", "default"] : []
    },
    build: {
        sourcemap: false
    },
    test: {
        environment: "jsdom",
        globals: true,
        include: ["src/**/*.{test,spec}.{js,ts}"]
    }
});
