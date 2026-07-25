// Build-time constants injected by @electron-forge/plugin-vite via Vite `define`.
// In dev, MAIN_WINDOW_VITE_DEV_SERVER_URL is the dev server URL; in a packaged
// build it is undefined.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;

// The renderer name from forge.config.ts ("main_window").
declare const MAIN_WINDOW_VITE_NAME: string;
