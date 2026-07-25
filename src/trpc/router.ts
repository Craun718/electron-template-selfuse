import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { app } from 'electron';
import { getDatabase, items } from '../lib/db';
import { store } from '../lib/store';
import log from '../lib/logger';
import type { Context } from './context';

// tRPC 10.45 declares context via a generic type; the actual context factory
// is handed to the adapter (createIPCHandler) in main.ts.
const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  appInfo: t.procedure.query(() => ({
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron ?? '',
    node: process.versions.node ?? '',
    platform: process.platform,
    arch: process.arch,
  })),

  listItems: t.procedure.query(() => {
    log.info('query listItems');
    return getDatabase().select().from(items).all();
  }),

  addItem: t.procedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ input }) => {
      // `.returning()` is a query builder; `.get()` materializes the insert
      // synchronously and returns the single inserted row.
      const created = getDatabase()
        .insert(items)
        .values({ name: input.name, createdAt: Date.now() })
        .returning()
        .get();
      log.info('mutation addItem', created.id, created.name);
      return created;
    }),

  getSettings: t.procedure.query(() => ({
    theme: store.get('theme'),
    lastOpenedAt: store.get('lastOpenedAt'),
  })),

  ping: t.procedure.query(() => {
    log.info('query ping');
    return { ok: true, at: Date.now() };
  }),
});

export type AppRouter = typeof appRouter;
