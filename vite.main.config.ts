import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    // Keep these as runtime requires so they resolve from node_modules in the
    // packaged app instead of being inlined by rollup:
    //  - better-sqlite3: native module, cannot be bundled.
    //  - ajv / ajv-formats: ajv ships compiled validators it loads via dynamic
    //    self-requires (`ajv/dist/runtime/*`) which rollup cannot inline (its
    //    package.json `exports` blocks those subpaths). Ship them as-is instead.
    rollupOptions: {
      external: ['better-sqlite3', 'ajv', 'ajv-formats'],
    },
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src'),
    },
  },
});
