/**
 * The authenticated desktop shell: top-right profile menu, the page content,
 * and the floating dock. Shows a brief, skippable first-load splash.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { ProfileMenu } from './ProfileMenu';
import { Dock } from './Dock';
import { Splash } from './Splash';
import { WindowManager } from './WindowManager';
import { usePrefs } from '../lib/prefs';

export function AppShell({ children, onSignedOut }: { children: ReactNode; onSignedOut: () => void }) {
  const prefs = usePrefs();
  const [showSplash, setShowSplash] = useState(prefs.showSplash);

  useEffect(() => {
    if (!showSplash) return;
    const id = setTimeout(() => setShowSplash(false), 900);
    return () => clearTimeout(id);
  }, [showSplash]);

  return (
    <div className="app-shell">
      <AnimatePresence>
        {showSplash && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--scene-base)' }}>
            <Splash onSkip={() => setShowSplash(false)} />
          </div>
        )}
      </AnimatePresence>

      <div className="topbar">
        <ProfileMenu onSignedOut={onSignedOut} />
      </div>
      <main className="app-main">{children}</main>
      <WindowManager />
      <Dock />
    </div>
  );
}
