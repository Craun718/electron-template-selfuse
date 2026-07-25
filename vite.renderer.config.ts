import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  // Absolute so output lands at project-root .vite/renderer/main_window,
  // not relative to `root` (which would nest it under src/renderer).
  build: {
    outDir: resolve(__dirname, '.vite/renderer/main_window'),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
    },
  },
});
