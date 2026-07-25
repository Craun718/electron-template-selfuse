import type { CreateContextOptions } from 'electron-trpc/main';

// Per-request context. Add shared dependencies here (db, store, logger) if you
// want them injected into procedures instead of imported directly.
export function createContext(_opts: CreateContextOptions) {
  return {};
}

export type Context = ReturnType<typeof createContext>;
