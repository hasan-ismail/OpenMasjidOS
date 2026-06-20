/** The fixed ambient backdrop: a custom wallpaper image if set, else the static
 *  aurora + khatam pattern + vignette. */
import { usePrefs } from '../lib/prefs';

export function SceneBackground() {
  const prefs = usePrefs();
  if (prefs.wallpaperImage) {
    return (
      <div
        className="scene scene--image"
        aria-hidden="true"
        style={{ backgroundImage: `url("${prefs.wallpaperImage}")` }}
      />
    );
  }
  return <div className="scene" aria-hidden="true" />;
}
