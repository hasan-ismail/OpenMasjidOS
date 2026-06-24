/**
 * Apple-style pointer reactivity: light refracting through the glass as the
 * cursor moves over it. We set --mx/--my (the cursor position within the hovered
 * pane) and the glass background renders the refraction there (see glass.css).
 *
 * Scoped to small widgets that opt in with `.fx-glint` (stat cards, app cards) —
 * NOT every glass surface. A moving highlight on big panels looks like a blob
 * and is expensive (repainting a large surface every frame). One delegated
 * pointermove listener, rAF-throttled, so cost is a single small repaint per
 * frame. Resets the previous pane when the cursor leaves it. Off under reduced
 * motion.
 */
const GLASS_SELECTOR = '.fx-glint';

let installed = false;

export function installCursorFx(): void {
  if (typeof window === 'undefined') return;
  if (installed) return; // idempotent — never stack duplicate listeners
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  // No hovering cursor (touch / kiosk screen) → the glint shows nothing useful,
  // so don't pay for a per-frame listener.
  if (
    window.matchMedia?.('(pointer: coarse)').matches ||
    !window.matchMedia?.('(hover: hover)').matches
  )
    return;
  installed = true;

  let last: HTMLElement | null = null;
  let target: HTMLElement | null = null;
  // Cache the hovered pane's rect so flush() doesn't force a layout every frame;
  // refresh it only when the pane changes, or on scroll/resize.
  let rect: DOMRect | null = null;
  let x = 0;
  let y = 0;
  let scheduled = false;

  function flush() {
    scheduled = false;
    if (!target || !rect) return;
    target.style.setProperty('--mx', `${x - rect.left}px`);
    target.style.setProperty('--my', `${y - rect.top}px`);
  }

  function invalidateRect() {
    // The cached rect is stale after scroll/resize; re-read it on the next frame
    // from the live target rather than per pointermove.
    rect = target ? target.getBoundingClientRect() : null;
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      // Highlight the nearest glass pane under the cursor. closest() returns the
      // innermost match, so a glass card inside a glass panel lights up the card.
      const el = (e.target as Element | null)?.closest?.(GLASS_SELECTOR) as HTMLElement | null;
      if (el !== last) {
        if (last) {
          last.style.removeProperty('--mx');
          last.style.removeProperty('--my');
        }
        last = el;
        // New pane → read its rect once (the only getBoundingClientRect now).
        rect = el ? el.getBoundingClientRect() : null;
      }
      if (!el) return;
      target = el;
      x = e.clientX;
      y = e.clientY;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    },
    { passive: true },
  );

  // A scrolled/resized pane has moved on screen, so the cached rect is wrong.
  window.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
  window.addEventListener('resize', invalidateRect, { passive: true });
}
