/**
 * Platform↔app integration endpoints (optional, backwards-compatible):
 *
 *   GET /api/auth/session       — introspect the omos_session cookie so an app's
 *                                 BACKEND can share the dashboard login (SSO).
 *                                 Server→server only; NOT CORS-enabled, so a
 *                                 cross-origin page can't read another user's
 *                                 auth status.
 *   GET /api/public/appearance  — the dashboard's presentation prefs (theme,
 *                                 wallpaper, accent, lang) so an app can match
 *                                 the masjid's look. No masjid data, low
 *                                 sensitivity → public + CORS so an app's
 *                                 browser can poll it for live theme changes.
 *
 * Neither moves masjid/prayer data into the platform (CLAUDE.md §13).
 */
import type { FastifyInstance } from 'fastify';
import { COOKIE_NAME, getSessionUser } from '../auth/sessions';
import { getSettings } from '../settings/store';

export function registerIntegration(server: FastifyInstance): void {
  // B1 — cookie introspection for single sign-on. Returns whether the session
  // cookie ON THIS REQUEST is valid; an app forwards the user's cookie here.
  server.get('/api/auth/session', async (req) => {
    const username = getSessionUser(req.cookies?.[COOKIE_NAME]);
    return username ? { authenticated: true, username } : { authenticated: false };
  });

  // A2 — public presentation prefs, readable cross-origin by apps.
  const appearance = () => {
    const a = getSettings().appearance;
    return { v: 1, theme: a.theme, wallpaper: a.wallpaper, wallpaperImage: a.wallpaperImage, accent: a.accent, lang: a.lang };
  };
  server.get('/api/public/appearance', async (_req, reply) => {
    reply.header('access-control-allow-origin', '*');
    reply.header('cache-control', 'no-store');
    return appearance();
  });
  // Preflight (in case an app sends a non-simple request).
  server.options('/api/public/appearance', async (_req, reply) => {
    reply
      .header('access-control-allow-origin', '*')
      .header('access-control-allow-methods', 'GET, OPTIONS')
      .header('access-control-allow-headers', '*')
      .code(204)
      .send();
  });
}
