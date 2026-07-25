import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src'),
    },
  },
});
