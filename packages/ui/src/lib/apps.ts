/** Helpers for installed-app cards/dock. */

/** The LAN URL an app is reachable at (first published port), or null. */
export function appUrl(app: { ports: number[] }): string | null {
  if (!app.ports || app.ports.length === 0) return null;
  return `${window.location.protocol}//${window.location.hostname}:${app.ports[0]}`;
}

export function appInitial(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}

export function openApp(app: { ports: number[] }): boolean {
  const url = appUrl(app);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
