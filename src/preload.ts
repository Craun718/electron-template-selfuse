import { exposeElectronTRPC } from 'electron-trpc/main';

// Exposes `window.electronTRPC`, the bridge the renderer's `ipcLink()` reads.
// contextIsolation stays on; the renderer never touches ipcRenderer directly.
exposeElectronTRPC();
