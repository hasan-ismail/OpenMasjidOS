/**
 * Mirrors the dashboard's presentation prefs to the server (debounced) so apps
 * can read them at GET /api/public/appearance and match the masjid's look. The
 * prefs themselves still live in the browser (lib/prefs.ts); this is a one-way,
 * best-effort sync. Renders nothing.
 */
import { useEffect, useRef } from 'react';
import { usePrefs } from '../lib/prefs';
import { trpc } from '../lib/trpc';

export function AppearanceSync() {
  const prefs = usePrefs();
  const update = trpc.settings.update.useMutation();
  const mutateRef = useRef(update.mutate);
  mutateRef.current = update.mutate;

  const { theme, wallpaper, wallpaperImage, accent, language } = prefs;

  useEffect(() => {
    const id = setTimeout(() => {
      mutateRef.current({ appearance: { theme, wallpaper, wallpaperImage, accent, lang: language } });
    }, 600);
    return () => clearTimeout(id);
  }, [theme, wallpaper, wallpaperImage, accent, language]);

  return null;
}
