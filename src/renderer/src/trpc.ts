import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { AppRouter } from '../../trpc/router';

// Fully typed proxy client. Each call is serialized over the electron-trpc IPC
// channel to the main-process router; no network involved.
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});
