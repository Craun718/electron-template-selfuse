import Store from 'electron-store';

export interface Settings {
  theme: 'light' | 'dark';
  lastOpenedAt: string | null;
}

// Persistent JSON settings stored under userData/config.json. The schema is
// typed so reads/writes are checked at compile time.
export const store = new Store<Settings>({
  defaults: {
    theme: 'dark',
    lastOpenedAt: null,
  },
});
