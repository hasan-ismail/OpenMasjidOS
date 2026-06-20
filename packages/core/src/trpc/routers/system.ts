/**
 * System info for Settings → Advanced: version, network details, the AGPL
 * source-code link, and the core update check (CLAUDE.md §3, §13.3).
 */
import { router, protectedProcedure } from '../trpc';
import { VERSION } from '../../version';
import { networkInfo, checkForUpdate, SOURCE_URL } from '../../system/system';

export const systemRouter = router({
  info: protectedProcedure.query(() => ({
    version: VERSION,
    network: networkInfo(),
    sourceUrl: SOURCE_URL,
  })),

  checkUpdate: protectedProcedure.query(() => checkForUpdate()),
});
