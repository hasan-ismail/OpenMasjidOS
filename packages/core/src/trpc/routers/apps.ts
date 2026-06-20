/**
 * Installed-app management: list, logs, and lifecycle controls. Update/repair
 * of the CORE never run here — only the installer touches the core project.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  listInstalled,
  getInstalled,
  appLogs,
  startApp,
  stopApp,
  restartApp,
  removeApp,
} from '../../apps/manager';

const idInput = z.object({ id: z.string().min(1).max(80) });

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: (err as Error).message });
  }
}

export const appsRouter = router({
  list: protectedProcedure.query(() => listInstalled()),

  get: protectedProcedure.input(idInput).query(({ input }) => getInstalled(input.id)),

  logs: protectedProcedure
    .input(z.object({ id: z.string().min(1), tail: z.number().int().min(1).max(2000).optional() }))
    .query(({ input }) => appLogs(input.id, input.tail ?? 200)),

  start: protectedProcedure.input(idInput).mutation(({ input }) =>
    wrap(async () => {
      await startApp(input.id);
      return { ok: true };
    }),
  ),

  stop: protectedProcedure.input(idInput).mutation(({ input }) =>
    wrap(async () => {
      await stopApp(input.id);
      return { ok: true };
    }),
  ),

  restart: protectedProcedure.input(idInput).mutation(({ input }) =>
    wrap(async () => {
      await restartApp(input.id);
      return { ok: true };
    }),
  ),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1), deleteData: z.boolean().optional() }))
    .mutation(({ input }) =>
      wrap(async () => {
        await removeApp(input.id, input.deleteData ?? false);
        return { removed: input.id };
      }),
    ),
});
