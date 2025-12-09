import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./webapp/src", import.meta.url)),
    },
  },
  server: {
    middlewareMode: true,
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  root: "webapp",
});
