import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "VideoKit",
      fileName: "videokit-player",
      formats: ["iife"],
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        name: "VideoKit",
      },
    },
  },
});
