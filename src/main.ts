import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import contextMenu from 'electron-context-menu';
import { createIPCHandler } from 'electron-trpc/main';
import log from './lib/logger';
import { initDatabase } from './lib/db';
import { store } from './lib/store';
import { appRouter } from './trpc/router';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Open external links in the system browser, never in-app.
  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    void win.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  return win;
}

app.whenReady().then(() => {
  log.info('starting', app.getName(), app.getVersion());

  contextMenu();
  initDatabase();
  store.set('lastOpenedAt', new Date().toISOString());

  // One IPC handler for all windows; attach each window so its subscriptions
  // are cleaned up on navigation/destroy.
  const handler = createIPCHandler({ router: appRouter });
  const openWindow = (): void => {
    handler.attachWindow(createWindow());
  };
  openWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
