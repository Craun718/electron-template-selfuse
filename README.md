# electron-template

Electron desktop app built with Vite 8, React 19, and electron-forge, managed with pnpm.
Integrates electron-trpc, electron-context-menu, electron-log, drizzle-orm + better-sqlite3,
Zustand, and electron-store.

## Requirements

- Node.js 22 LTS (see .nvmrc). Node 24 is not supported because extract-zip@2.0.1 (used by @electron/packager) hangs on Node 24.
- pnpm 11+

## Scripts

- pnpm start: run in dev (Vite dev server + Electron, with HMR).
- pnpm package: build a production bundle into out/.
- pnpm make: build installers / dmg / zip via the configured makers.
- pnpm build: build for win-x64, darwin-arm64, linux-arm64, linux-x64 via scripts/build.mjs.
- pnpm typecheck: type-check main, preload, and React renderer with tsc.

## Structure

- forge.config.ts: electron-forge config (vite + fuses plugins, makers).
- vite.main.config.ts / vite.preload.config.ts / vite.renderer.config.ts: per-role Vite configs; the renderer one wires up @vitejs/plugin-react.
- src/main.ts: main process entry. Boots the window, context menu, SQLite database, electron-store, and the tRPC IPC handler.
- src/preload.ts: calls exposeElectronTRPC() to bridge window.electronTRPC for the renderer's ipcLink().
- src/lib/db.ts: better-sqlite3 + drizzle-orm schema, initDatabase()/getDatabase() (file lives under userData/app.db).
- src/lib/store.ts: typed electron-store settings (theme, lastOpenedAt).
- src/lib/logger.ts: electron-log wrapper (file + console, under userData).
- src/trpc/router.ts + context.ts: tRPC v10 router (appInfo, listItems, addItem, getSettings, ping) and context factory.
- src/renderer/src/trpc.ts: typed tRPC client over ipcLink().
- src/renderer/src/stores/app.ts: Zustand store that calls the tRPC procedures.
- src/renderer/: React app (index.html, src/main.tsx, App.tsx, env.d.ts).
- pnpm-workspace.yaml: pnpm 11 settings (nodeLinker, registry, electron_mirror, allowBuilds).

## Notes

- Integrated libraries: tRPC calls go main -> IPC -> renderer over electron-trpc (no network). better-sqlite3 is a native Node-API module, so the same prebuild runs under Node and Electron without a rebuild. electron-store pulls in ajv/ajv-formats, whose package.json `exports` blocks the subpaths rollup would need, so they stay external.
- Packaging native/external modules: plugin-vite bundles main/preload/renderer and the Vite plugin's default `ignore` ships only `.vite/`. The externalized better-sqlite3 + ajv closure (computed in forge.config.ts) is copied into the staged app by the packageAfterCopy hook, and asar unpacks `**/*.node`. This keeps the production node_modules minimal.
- TypeScript is on ^6.0.3. The previous vue-tsc dependency (which forced the pin) has been removed; it is now safe to bump TypeScript.
- pnpm-workspace.yaml sets nodeLinker: hoisted (required by electron-forge), blockExoticSubdeps: false (for @electron/rebuild), and allowBuilds (pnpm 11 build-gating for native modules).
- The plugin-vite bundles main, preload, and renderer into .vite. In dev the main process loads the Vite dev server URL (MAIN_WINDOW_VITE_DEV_SERVER_URL); in packaged builds it loads the built index.html. contextIsolation is on and nodeIntegration is off, so the renderer only reaches Node through the preload IPC bridge.
