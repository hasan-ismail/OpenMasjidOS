// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * Live system stats. `get` is a plain query (instant first paint / fallback);
 * `stream` is a WebSocket subscription that yields a fresh snapshot every ~2s
 * (CLAUDE.md §12). Both are protected.
 */
import { router, protectedProcedure } from '../trpc';
import { collectStats } from '../../stats/collector';

const CADENCE_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const statsRouter = router({
  get: protectedProcedure.query(() => collectStats()),

  stream: protectedProcedure.subscription(async function* (opts) {
    yield await collectStats();
    while (!opts.signal?.aborted) {
      await sleep(CADENCE_MS);
      if (opts.signal?.aborted) break;
      yield await collectStats();
    }
  }),
});
