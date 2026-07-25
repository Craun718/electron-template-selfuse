import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getInfo: () => ipcRenderer.invoke('app:get-info'),
} as const;

// contextIsolation is on (Electron default), so always use the bridge.
contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
