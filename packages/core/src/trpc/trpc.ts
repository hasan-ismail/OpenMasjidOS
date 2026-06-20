/**
 * tRPC primitives. publicProcedure is open (auth/first-run only);
 * protectedProcedure requires a valid session — every feature router uses it,
 * so nothing is reachable unauthenticated (CLAUDE.md §9).
 */
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.username) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in to continue.' });
  }
  return next({ ctx: { ...ctx, username: ctx.username } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
