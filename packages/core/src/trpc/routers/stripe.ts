// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * Stripe account vault (Settings → Payments). Admin-only CRUD over named Stripe
 * accounts. `list` returns a sanitized view (no secret/webhook values); the full
 * keys are only ever handed to an installed app over the secret-gated Fabric
 * endpoint (api/fabric.ts → GET /api/fabric/stripe).
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { listAccountsPublic, upsertAccount, removeAccount } from '../../store/stripe';

export const stripeRouter = router({
  list: protectedProcedure.query(() => listAccountsPublic()),

  save: protectedProcedure
    .input(
      z.object({
        id: z.string().max(80).optional(),
        label: z.string().trim().min(1, 'Give this account a name.').max(60),
        // Publishable key may be left blank on update (keeps the existing one).
        publishableKey: z.string().trim().max(255),
        // Secret/webhook blank on update = keep existing; required on create.
        secretKey: z.string().trim().max(255).optional(),
        webhookSecret: z.string().trim().max(255).optional(),
      }),
    )
    .mutation(({ input }) => {
      try {
        return upsertAccount(input);
      } catch (err) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: (err as Error).message });
      }
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      removeAccount(input.id);
      return { ok: true };
    }),
});
