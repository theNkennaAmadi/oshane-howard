import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  plugins:[
      glsl()
  ]
});
