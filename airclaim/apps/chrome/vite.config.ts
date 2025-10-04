import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "src/chrome-extension/manifest.json", dest: "." },
        { src: "src/chrome-extension/public/16.png", dest: "./public" },
        { src: "src/chrome-extension/public/32.png", dest: "./public" },
        { src: "src/chrome-extension/public/48.png", dest: "./public" },
        { src: "src/chrome-extension/public/192.png", dest: "./public" },
        { src: "src/chrome-extension/content-style.css", dest: "." },
      ],
    }),
  ],
  define: {
    global: "globalThis",
  },
  server: {
    open: "/popup-local.html",
  },
  build: {
    target: "es2015",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        // Add TypeScript files as entry points for compilation
        background: resolve(__dirname, "src/chrome-extension/background.ts"),
        content: resolve(__dirname, "src/chrome-extension/content-vanilla.ts"),
        injected: resolve(__dirname, "src/chrome-extension/injected.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Ensure extension files are named correctly
          if (["background", "content", "injected"].includes(chunkInfo.name)) {
            return `${chunkInfo.name}.js`;
          }
          return "[name].js";
        },
        // Prevent code splitting for extension files
        manualChunks: undefined,
      },
    },
    // Ensure the build outputs to the correct directory
    outDir: "dist",
    emptyOutDir: true,
  },
});
