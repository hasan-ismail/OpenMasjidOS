/**
 * Renders every open window (terminals, logs, file viewers). Mounted once in
 * AppShell, above the routed page, so windows persist across navigation. Each
 * frame is a floating, draggable macOS-style window with traffic lights;
 * minimized ones stay mounted but hidden (their dock entry restores them).
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Minus, Maximize2 } from 'lucide-react';
import { useWindows, type WindowState } from './Windows';

export function WindowManager() {
  const { windows } = useWindows();
  // Stack by focus order so the most-recently-focused window is on top.
  const ordered = [...windows].sort((a, b) => a.z - b.z);
  return (
    <>
      {ordered.map((w, i) => (
        <WindowFrame key={w.id} win={w} zIndex={110 + i} />
      ))}
    </>
  );
}

function WindowFrame({ win, zIndex }: { win: WindowState; zIndex: number }) {
  const { t } = useTranslation();
  const { close, minimize, focus, toggleFullscreen } = useWindows();
  const frameRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Close the front-most window on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !win.minimized) close(win.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [win.id, win.minimized, close]);

  function startDrag(e: ReactPointerEvent) {
    if (win.fullscreen) return;
    // Don't start a drag from the traffic-light buttons.
    if ((e.target as HTMLElement).closest('.tl')) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const start = pos ?? { x: rect.left, y: rect.top };
    const offX = e.clientX - start.x;
    const offY = e.clientY - start.y;
    setPos(start);

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(0, Math.min(window.innerWidth - 120, ev.clientX - offX));
      const y = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - offY));
      setPos({ x, y });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    e.preventDefault();
  }

  const positionStyle: CSSProperties = win.fullscreen
    ? { left: '2vw', top: '4vh', width: '96vw', height: '92vh', transform: 'none' }
    : pos
      ? { left: pos.x, top: pos.y, transform: 'none' }
      : {};

  return (
    <div
      ref={frameRef}
      className={`win-pos${win.fullscreen || pos ? '' : ' win-pos--center'}`}
      style={{ ...positionStyle, zIndex, display: win.minimized ? 'none' : undefined }}
      onPointerDown={() => focus(win.id)}
    >
      <div className={`win glass-raised win-enter${win.wide ? ' win--wide' : ''}`} style={win.fullscreen ? { width: '100%', height: '100%', maxHeight: 'none' } : undefined}>
        <header className="win-head" onPointerDown={startDrag} onDoubleClick={() => toggleFullscreen(win.id)}>
          <div className="traffic" role="group" aria-label="Window controls">
            <button className="tl tl-close" aria-label={t('common.close')} onClick={() => close(win.id)}>
              <X size={9} strokeWidth={3.5} />
            </button>
            <button className="tl tl-min" aria-label="Minimize" onClick={() => minimize(win.id)}>
              <Minus size={9} strokeWidth={3.5} />
            </button>
            <button className="tl tl-full" aria-label="Fullscreen" onClick={() => toggleFullscreen(win.id)}>
              <Maximize2 size={8} strokeWidth={3.5} />
            </button>
          </div>
          <h2 className="win-title">
            {win.icon}
            <span>{win.title}</span>
          </h2>
        </header>
        <div className="win-body">{win.node}</div>
      </div>
    </div>
  );
}
