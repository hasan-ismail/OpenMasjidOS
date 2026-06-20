/**
 * A small window manager for in-dashboard windows (terminals, logs, file
 * viewers). Windows are owned at the top level (see WindowManager, mounted in
 * AppShell) so they survive route changes — minimizing a shell and walking to
 * Settings keeps it alive in the dock. Window content stays mounted while
 * minimized (hidden with CSS) so live connections (a terminal, a log stream)
 * are never dropped.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface OpenWindowOptions {
  title: string;
  node: ReactNode;
  /** Wider frame (terminals, logs, file editors). */
  wide?: boolean;
  /** Icon shown on the dock item + hover preview. */
  icon?: ReactNode;
  /** Reopening with the same key focuses the existing window instead of duplicating it. */
  dedupeKey?: string;
}

export interface WindowState {
  id: number;
  title: string;
  node: ReactNode;
  wide: boolean;
  icon?: ReactNode;
  dedupeKey?: string;
  minimized: boolean;
  fullscreen: boolean;
  /** Monotonic focus order — higher is more recently focused (front). */
  z: number;
}

interface WindowsApi {
  windows: WindowState[];
  open: (opts: OpenWindowOptions) => number;
  close: (id: number) => void;
  minimize: (id: number) => void;
  restore: (id: number) => void;
  focus: (id: number) => void;
  toggleFullscreen: (id: number) => void;
}

const noop = () => {};
const WindowsCtx = createContext<WindowsApi>({
  windows: [],
  open: () => -1,
  close: noop,
  minimize: noop,
  restore: noop,
  focus: noop,
  toggleFullscreen: noop,
});

export function useWindows(): WindowsApi {
  return useContext(WindowsCtx);
}

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  // A ref mirror so open()/dedupe can read the current list synchronously.
  const ref = useRef<WindowState[]>([]);
  const idRef = useRef(1);
  const zRef = useRef(1);

  const setWins = useCallback((updater: (list: WindowState[]) => WindowState[]) => {
    setWindows((list) => {
      const next = updater(list);
      ref.current = next;
      return next;
    });
  }, []);

  const focus = useCallback(
    (id: number) => {
      const z = ++zRef.current;
      setWins((list) => list.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)));
    },
    [setWins],
  );

  const open = useCallback(
    (opts: OpenWindowOptions) => {
      if (opts.dedupeKey) {
        const existing = ref.current.find((w) => w.dedupeKey === opts.dedupeKey);
        if (existing) {
          focus(existing.id);
          return existing.id;
        }
      }
      const id = idRef.current++;
      const z = ++zRef.current;
      setWins((list) => [
        ...list,
        {
          id,
          title: opts.title,
          node: opts.node,
          wide: opts.wide ?? false,
          icon: opts.icon,
          dedupeKey: opts.dedupeKey,
          minimized: false,
          fullscreen: false,
          z,
        },
      ]);
      return id;
    },
    [focus, setWins],
  );

  const close = useCallback((id: number) => setWins((list) => list.filter((w) => w.id !== id)), [setWins]);
  const minimize = useCallback(
    (id: number) => setWins((list) => list.map((w) => (w.id === id ? { ...w, minimized: true } : w))),
    [setWins],
  );
  const toggleFullscreen = useCallback(
    (id: number) => setWins((list) => list.map((w) => (w.id === id ? { ...w, fullscreen: !w.fullscreen } : w))),
    [setWins],
  );

  return (
    <WindowsCtx.Provider value={{ windows, open, close, minimize, restore: focus, focus, toggleFullscreen }}>
      {children}
    </WindowsCtx.Provider>
  );
}
