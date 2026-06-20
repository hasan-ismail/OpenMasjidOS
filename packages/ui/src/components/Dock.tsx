/**
 * The floating bottom dock (umbrelOS-style, our own implementation). Primary
 * nav + pinned apps + minimized windows. Drag an app card here to pin it; drag
 * pinned apps to reorder them; hover any item for its name, or a live window's
 * preview. The dock lives in AppShell, so it (and minimized windows) persist
 * across every route.
 */
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store as StoreIcon, Settings as SettingsIcon, FolderOpen, AppWindow } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { usePrefs, prefsStore } from '../lib/prefs';
import { useWindows } from './Windows';
import { cn } from '../lib/cn';
import { openApp, appInitial } from '../lib/apps';
import { MasjidMark } from './Glyphs';

const PIN_MIME = 'application/omos-pin';
const APP_MIME = 'application/omos-app';

export function Dock() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const { windows, restore } = useWindows();
  const [dropHint, setDropHint] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const appsQuery = trpc.apps.list.useQuery(undefined, { refetchInterval: 8000 });
  const apps = appsQuery.data ?? [];

  const pinnedApps = prefs.pinnedApps
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const openWindows = windows; // minimized + visible; clicking restores/focuses

  return (
    <nav
      className={cn('dock glass-dock', dropHint && 'dock-drop-hint')}
      aria-label={t('nav.aria.primary')}
      onDragOver={(e) => {
        const types = e.dataTransfer.types;
        if (types.includes(APP_MIME)) {
          e.preventDefault();
          setDropHint(true);
        } else if (types.includes(PIN_MIME)) {
          // Allow dropping a reordered pin onto empty dock space (→ move to end).
          e.preventDefault();
        }
      }}
      onDragLeave={() => setDropHint(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropHint(false);
        const appId = e.dataTransfer.getData(APP_MIME);
        if (appId) prefsStore.pin(appId);
        const pinId = e.dataTransfer.getData(PIN_MIME);
        if (pinId) prefsStore.movePin(pinId, null); // dropped on empty dock area → move to end
      }}
    >
      <DockLink to="/" end icon={<MasjidMark size={22} />} label={t('nav.dashboard')} />
      <DockLink to="/store" icon={<StoreIcon size={20} />} label={t('nav.store')} />
      <DockLink to="/files" icon={<FolderOpen size={20} />} label={t('nav.files')} />
      <DockLink to="/settings" icon={<SettingsIcon size={20} />} label={t('nav.settings')} />

      {pinnedApps.length > 0 && <span className="dock-divider" aria-hidden="true" />}

      {pinnedApps.map((app) => (
        <button
          key={app.id}
          className={cn('dock-item', dragOver === app.id && 'dock-item--drag-over')}
          aria-label={app.name}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(PIN_MIME, app.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(PIN_MIME)) {
              e.preventDefault();
              setDragOver(app.id);
            }
          }}
          onDragLeave={() => setDragOver((cur) => (cur === app.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(null);
            const pinId = e.dataTransfer.getData(PIN_MIME);
            if (pinId && pinId !== app.id) prefsStore.movePin(pinId, app.id);
          }}
          onClick={() => openApp(app)}
        >
          {app.icon ? (
            <span className="app-initial" style={{ background: 'transparent' }}>
              <img src={app.icon} alt="" style={{ width: '100%', height: '100%', borderRadius: '0.85rem', objectFit: 'cover' }} />
            </span>
          ) : (
            <span className="app-initial">{appInitial(app.name)}</span>
          )}
          <span className="dock-pop"><span className="dock-tip glass-raised">{app.name}</span></span>
        </button>
      ))}

      {openWindows.length > 0 && <span className="dock-divider" aria-hidden="true" />}

      {openWindows.map((w) => (
        <button
          key={w.id}
          className="dock-item dock-item--window"
          aria-label={w.title}
          onClick={() => restore(w.id)}
        >
          <AppWindow size={20} />
          {w.minimized && <span className="dock-dot" aria-hidden="true" />}
          <span className="dock-pop">
            <span className="dock-preview glass-raised">
              <span className="dock-preview__bar">
                <span className="dock-preview__dots">
                  <i style={{ background: '#FF5F57' }} />
                  <i style={{ background: '#FEBC2E' }} />
                  <i style={{ background: '#28C840' }} />
                </span>
                <span className="dock-preview__title">{w.title}</span>
              </span>
              <span className="dock-preview__body">
                {w.icon}
                <span>{w.minimized ? t('windows.minimized') : t('windows.open')}</span>
              </span>
            </span>
          </span>
        </button>
      ))}
    </nav>
  );
}

function DockLink({ to, end, icon, label }: { to: string; end?: boolean; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn('dock-item', isActive && 'is-active')} aria-label={label}>
      {icon}
      <span className="dock-pop"><span className="dock-tip glass-raised">{label}</span></span>
    </NavLink>
  );
}
