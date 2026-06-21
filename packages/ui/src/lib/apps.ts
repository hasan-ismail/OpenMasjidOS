/** Helpers for installed-app cards/dock. */
import { prefsStore } from './prefs';

/** The LAN URL an app is reachable at (first published port), or null. */
export function appUrl(app: { ports: number[] }): string | null {
  if (!app.ports || app.ports.length === 0) return null;
  return `${window.location.protocol}//${window.location.hostname}:${app.ports[0]}`;
}

/**
 * Appearance hand-off (OpenMasjidOS Fabric, A1). We pass the viewer's
 * presentation prefs (theme/wallpaper/accent/language) to the app as a URL
 * FRAGMENT (`#omos=…`) — the part after `#` is never sent to a server or logged,
 * and is cross-origin safe. An integrated app reads it on load to match the
 * dashboard's look; apps that don't understand it just ignore the hash.
 */
function appearanceHash(): string {
  const p = prefsStore.get();
  const payload = {
    v: 1,
    theme: p.theme,
    wallpaper: p.wallpaper,
    wallpaperImage: p.wallpaperImage || undefined,
    accent: p.accent,
    lang: p.language,
  };
  // base64url(JSON) — no padding, URL-safe.
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `#omos=${b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

/** Best-effort favicon URL for an app (used as its icon when none is set). */
export function appFaviconUrl(app: { ports: number[] }): string | null {
  const base = appUrl(app);
  return base ? `${base}/favicon.ico` : null;
}

export function appInitial(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}

/** Deterministic colourful gradient per app id (umbrelOS-style variety). */
export function appColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(150deg, hsl(${h} 70% 55%), hsl(${h2} 75% 45%))`;
}

export function openApp(app: { ports: number[] }): boolean {
  const url = appUrl(app);
  if (!url) return false;
  window.open(url + appearanceHash(), '_blank', 'noopener,noreferrer');
  return true;
}
