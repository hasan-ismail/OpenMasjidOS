/**
 * Auth & first-run. The very first visit creates the single admin account;
 * thereafter it's a plain login. Wrong credentials get a friendly, throttled
 * error (CLAUDE.md §9). No masjid/prayer details are collected here.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from '../../auth/passwords';
import {
  isConfigured,
  getUsername,
  getPasswordHash,
  setCredentials,
  updatePasswordHash,
} from '../../auth/store';
import {
  createSession,
  destroySession,
  destroyAllSessions,
} from '../../auth/sessions';

// Very small in-memory login throttle: after repeated failures, brief cooldown.
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;
let failures = 0;
let cooldownUntil = 0;

const credentials = z.object({
  username: z.string().trim().min(1, 'Please enter a username.').max(64),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`),
});

export const authRouter = router({
  /** Drives first-run vs login, and reports who is signed in. */
  me: publicProcedure.query(({ ctx }) => ({
    setupRequired: !isConfigured(),
    authenticated: Boolean(ctx.username),
    username: ctx.username,
  })),

  /** First-run only: create the admin account and start a session. */
  setup: publicProcedure.input(credentials).mutation(async ({ input, ctx }) => {
    if (isConfigured()) {
      throw new TRPCError({ code: 'CONFLICT', message: 'An account already exists. Please sign in.' });
    }
    const hash = await hashPassword(input.password);
    setCredentials(input.username, hash);
    const token = createSession(input.username);
    ctx.setSessionCookie?.(token);
    return { authenticated: true, username: input.username };
  }),

  /** Sign in with the admin credentials. */
  login: publicProcedure
    .input(z.object({ username: z.string().trim().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (!isConfigured()) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No account yet — please set one up.' });
      }
      if (Date.now() < cooldownUntil) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many attempts. Please wait a moment and try again.',
        });
      }
      const okUser = input.username === getUsername();
      const okPass = okUser && (await verifyPassword(getPasswordHash() ?? '', input.password));
      if (!okUser || !okPass) {
        failures += 1;
        if (failures >= MAX_ATTEMPTS) {
          cooldownUntil = Date.now() + COOLDOWN_MS;
          failures = 0;
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'That username or password is incorrect.' });
      }
      failures = 0;
      const token = createSession(input.username);
      ctx.setSessionCookie?.(token);
      return { authenticated: true, username: input.username };
    }),

  /** Sign out: drop this session and clear the cookie. */
  logout: publicProcedure.mutation(({ ctx }) => {
    destroySession(ctx.sessionToken);
    ctx.clearSessionCookie?.();
    return { authenticated: false };
  }),

  /** Change the admin password; every existing session is invalidated. */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await verifyPassword(getPasswordHash() ?? '', input.currentPassword);
      if (!ok) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Your current password is incorrect.' });
      }
      updatePasswordHash(await hashPassword(input.newPassword));
      destroyAllSessions();
      const token = createSession(ctx.username);
      ctx.setSessionCookie?.(token);
      return { ok: true };
    }),
});
