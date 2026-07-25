# electron-template

Electron desktop app built with Vite 8, Vue 3, and electron-forge, managed with pnpm.

## Requirements

- Node.js 22 LTS (see .nvmrc). Node 24 is not supported because extract-zip@2.0.1 (used by @electron/packager) hangs on Node 24.
- pnpm 11+

## Scripts

- pnpm start: run in dev (Vite dev server + Electron, with HMR).
- pnpm package: build a production bundle into out/.
- pnpm make: build installers / dmg / zip via the configured makers.
- pnpm typecheck: type-check main, preload, and Vue renderer with vue-tsc.

## Structure

- forge.config.ts: electron-forge config (vite + fuses plugins, makers).
- vite.main.config.ts / vite.preload.config.ts / vite.renderer.config.ts: per-role Vite configs; the renderer one wires up @vitejs/plugin-vue.
- src/main.ts: main process (window lifecycle, IPC handlers).
- src/preload.ts: exposes a typed window.api via contextBridge; exports the Api type the renderer imports.
- src/renderer/: Vue app (index.html, src/main.ts, App.vue, env.d.ts).
- pnpm-workspace.yaml: pnpm 11 settings (nodeLinker, registry, electron_mirror, allowBuilds).

## Notes

- TypeScript is pinned to ^6.0.3. TS 7 removes the ./lib/tsc subpath from its exports map, which breaks vue-tsc.
- pnpm-workspace.yaml sets nodeLinker: hoisted (required by electron-forge), blockExoticSubdeps: false (for @electron/rebuild), and allowBuilds (pnpm 11 build-gating for native modules).
- The plugin-vite bundles main, preload, and renderer into .vite. In dev the main process loads the Vite dev server URL (MAIN_WINDOW_VITE_DEV_SERVER_URL); in packaged builds it loads the built index.html. contextIsolation is on and nodeIntegration is off, so the renderer only reaches Node through the preload IPC bridge.
