/**
 * tRPC request context. Resolves the signed-in admin from the session cookie
 * for BOTH HTTP requests and the WebSocket upgrade request (we parse the raw
 * Cookie header so it works in either case). Cookie mutation helpers are only
 * present for HTTP, where a Fastify reply exists.
 */
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { COOKIE_NAME, getSessionUser, SESSION_TTL_MS } from '../auth/sessions';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  // Not Secure: the dashboard is served over plain HTTP on the LAN (CLAUDE.md §9).
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
};

export interface Context {
  username: string | null;
  sessionToken: string | null;
  setSessionCookie?: (token: string) => void;
  clearSessionCookie?: () => void;
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function createContext({ req, res }: CreateFastifyContextOptions): Context {
  const token =
    (req.cookies && req.cookies[COOKIE_NAME]) ?? parseCookie(req.headers?.cookie, COOKIE_NAME);
  const username = getSessionUser(token);

  const canMutateCookies = res && typeof res.setCookie === 'function';
  return {
    username,
    sessionToken: token ?? null,
    setSessionCookie: canMutateCookies ? (t: string) => res.setCookie(COOKIE_NAME, t, COOKIE_OPTS) : undefined,
    clearSessionCookie: canMutateCookies ? () => res.clearCookie(COOKIE_NAME, { path: '/' }) : undefined,
  };
}
