/**
 * Builds the tRPC client links: subscriptions ride a WebSocket (live stats),
 * everything else uses batched HTTP. All same-origin — the core serves both the
 * UI and the API, and in dev Vite proxies /trpc (http + ws) to the daemon.
 */
import { createWSClient, wsLink, splitLink, httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';

function wsUrl(): string {
  const { protocol, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${host}/trpc`;
}

export function makeTrpcClient() {
  const wsClient = createWSClient({ url: wsUrl() });
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({ client: wsClient }),
        false: httpBatchLink({ url: '/trpc' }),
      }),
    ],
  });
}
