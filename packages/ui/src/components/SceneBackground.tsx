/** The fixed ambient backdrop: a custom wallpaper image if set, else the static
 *  aurora + khatam pattern + vignette. */
import { usePrefs } from '../lib/prefs';

// Only accept a plain http(s) URL with no characters that could break out of
// the CSS url("…") value. Anything else falls back to the gradient scene.
function safeImageUrl(value: string): string | null {
  const v = value.trim();
  return /^https?:\/\/[^\s"'()]+$/i.test(v) ? v : null;
}

export function SceneBackground() {
  const prefs = usePrefs();
  const img = safeImageUrl(prefs.wallpaperImage);
  if (img) {
    // Set sizing inline: `.scene { background: … }` is a shorthand that resets
    // background-size to `auto`, which would otherwise show a 4K image at native
    // size (cropped to the top-left). Inline always wins, so the image is
    // scaled to fill the screen.
    return (
      <div
        className="scene scene--image"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${img}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }
  return <div className="scene" aria-hidden="true" />;
}
