/**
 * Server-side sessions. Tokens are long random strings held in memory and set
 * in an HTTP-only, SameSite=Strict cookie. They are NOT marked Secure because
 * the dashboard is reached over plain HTTP on the LAN (CLAUDE.md). Sessions
 * reset on a daemon restart — the admin simply signs in again.
 */
import crypto from 'node:crypto';

export const COOKIE_NAME = 'omos_session';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface Session {
  username: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

function sweep(): void {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (s.expiresAt <= now) sessions.delete(token);
  }
}

export function createSession(username: string): string {
  sweep();
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { username, expiresAt: Date.now() + TTL_MS });
  return token;
}

/** Resolve the username for a token, or null if missing/expired. */
export function getSessionUser(token: string | undefined | null): string | null {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s.username;
}

export function destroySession(token: string | undefined | null): void {
  if (token) sessions.delete(token);
}

/** Drop every session — used after a password change so old cookies die. */
export function destroyAllSessions(): void {
  sessions.clear();
}

export const SESSION_TTL_MS = TTL_MS;
