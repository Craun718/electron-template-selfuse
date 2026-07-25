import { create } from 'zustand';
import type { Item } from '../../../lib/db';
import { trpc } from '../trpc';

interface AppInfo {
  name: string;
  version: string;
  electron: string;
  node: string;
  platform: string;
  arch: string;
}

interface Settings {
  theme: 'light' | 'dark';
  lastOpenedAt: string | null;
}

interface AppState {
  info: AppInfo | null;
  items: Item[];
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (name: string) => Promise<void>;
}

// Zustand store standing in for the former Pinia store. The shape is the same:
// `info/items/settings` are renderer-side caches of main-process data fetched
// over electron-trpc; `loading/error` are pure UI state.
export const useAppStore = create<AppState>((set, get) => ({
  info: null,
  items: [],
  settings: null,
  loading: false,
  error: null,

  async refresh() {
    set({ loading: true, error: null });
    try {
      const [appInfo, list, stored] = await Promise.all([
        trpc.appInfo.query(),
        trpc.listItems.query(),
        trpc.getSettings.query(),
      ]);
      set({ info: appInfo, items: list, settings: stored });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },

  async addItem(name) {
    await trpc.addItem.mutate({ name });
    await get().refresh();
  },
}));
