/**
 * The typed tRPC React client. The AppRouter TYPE comes from the core package
 * (types only — no server runtime ever enters the browser bundle, CLAUDE.md §7).
 */
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@openmasjid/core';

export const trpc = createTRPCReact<AppRouter>();
