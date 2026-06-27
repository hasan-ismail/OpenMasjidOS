// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * Cloudflare Tunnel (Settings → Remote access). Admin-only. The token is a secret
 * written to config/cloudflare/.env (chmod 600, system/cloudflared.ts) and never
 * returned here — `status` reports only whether one is set + the live run state.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { getSettings, updateCloudflare } from '../../settings/store';
import {
  hasToken,
  setToken,
  clearTunnel,
  ensureCloudflared,
  cloudflaredRunning,
} from '../../system/cloudflared';

async function status() {
  const cf = getSettings().cloudflare;
  return { enabled: cf.enabled, domain: cf.domain, hasToken: hasToken(), running: await cloudflaredRunning() };
}

export const cloudflareRouter = router({
  status: protectedProcedure.query(() => status()),

  save: protectedProcedure
    .input(
      z.object({
        domain: z.string().trim().max(253).optional(),
        token: z.string().trim().max(8192).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.domain !== undefined) {
        updateCloudflare({ domain: input.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '') });
      }
      if (input.token) {
        try {
          setToken(input.token);
        } catch (err) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: (err as Error).message });
        }
      }
      await ensureCloudflared(); // restart with the new token if remote access is on
      return status();
    }),

  setEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      if (input.enabled && !hasToken()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add your Cloudflare tunnel token first.' });
      }
      updateCloudflare({ enabled: input.enabled });
      await ensureCloudflared();
      return status();
    }),

  clear: protectedProcedure.mutation(async () => {
    await clearTunnel();
    updateCloudflare({ enabled: false });
    return status();
  }),
});
