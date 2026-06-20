/**
 * An installed-app tile. The card body opens the app detail page; the Open
 * action launches the running app in a new tab; the ⋯ menu has lifecycle
 * controls. Cards are draggable onto the dock to pin them.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MoreVertical,
  ExternalLink,
  Play,
  Square,
  RotateCw,
  Pin,
  PinOff,
  Trash2,
  ScrollText,
} from 'lucide-react';
import { trpc } from '../lib/trpc';
import { usePrefs, prefsStore } from '../lib/prefs';
import { openApp, appInitial } from '../lib/apps';
import { useToast } from './ToastProvider';
import { Modal } from './Modal';
import { staggerItem } from '../lib/motion';
import type { InstalledApp } from '../lib/types';

export function AppCard({ app }: { app: InstalledApp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const prefs = usePrefs();
  const pinned = prefs.pinnedApps.includes(app.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteData, setDeleteData] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [menuOpen]);

  const refresh = () => utils.apps.list.invalidate();
  const start = trpc.apps.start.useMutation({ onSuccess: refresh });
  const stop = trpc.apps.stop.useMutation({ onSuccess: refresh });
  const restart = trpc.apps.restart.useMutation({ onSuccess: refresh });
  const remove = trpc.apps.remove.useMutation({
    onSuccess: () => {
      refresh();
      toast(t('common.saved'), 'success');
    },
    onError: (e) => toast(e.message || t('errors.generic'), 'error'),
  });

  function handleOpen() {
    if (!openApp(app)) toast(t('appDetail.notFound'), 'error');
  }

  return (
    <>
      <motion.div
        className="app-card glass"
        variants={staggerItem}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('application/omos-app', app.id)}
        onClick={() => navigate(`/apps/${encodeURIComponent(app.id)}`)}
      >
        <div className="app-card__top">
          <div className="app-icon">
            {app.icon ? <img src={app.icon} alt="" /> : appInitial(app.name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="app-name">{app.name}</div>
            <div className="app-meta">
              <span className={`status-dot ${app.running ? '' : 'status-dot--idle'}`} />
              {app.running ? t('status.running') : t('status.stopped')}
              <span className={`tag ${app.kind === 'custom' ? 'tag--custom' : 'tag--official'}`}>
                {app.kind === 'custom' ? t('tags.custom') : t('tags.official')}
              </span>
            </div>
          </div>
        </div>

        <div className="app-card__actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn--sm btn--primary" onClick={handleOpen} disabled={!app.running}>
            <ExternalLink size={15} /> {t('actions.open')}
          </button>

          <div style={{ position: 'relative', marginInlineStart: 'auto' }} ref={menuRef}>
            <button
              className="icon-btn"
              aria-label={t('actions.options')}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="menu glass-raised" style={{ position: 'absolute', insetInlineEnd: 0, insetBlockStart: '2.4rem', minWidth: '12rem' }}>
                <button className="menu-item" onClick={() => { setMenuOpen(false); navigate(`/apps/${encodeURIComponent(app.id)}`); }}>
                  <ScrollText size={16} /> {t('actions.viewLogs')}
                </button>
                {app.running ? (
                  <>
                    <button className="menu-item" onClick={() => { setMenuOpen(false); stop.mutate({ id: app.id }); }}>
                      <Square size={16} /> {t('actions.stop')}
                    </button>
                    <button className="menu-item" onClick={() => { setMenuOpen(false); restart.mutate({ id: app.id }); }}>
                      <RotateCw size={16} /> {t('actions.restart')}
                    </button>
                  </>
                ) : (
                  <button className="menu-item" onClick={() => { setMenuOpen(false); start.mutate({ id: app.id }); }}>
                    <Play size={16} /> {t('actions.start')}
                  </button>
                )}
                <button className="menu-item" onClick={() => { setMenuOpen(false); prefsStore.togglePin(app.id); }}>
                  {pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  {pinned ? t('actions.unpin') : t('actions.pin')}
                </button>
                <div className="menu-sep" />
                <button className="menu-item" style={{ color: 'var(--color-danger)' }} onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}>
                  <Trash2 size={16} /> {t('actions.uninstall')}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t('appCard.removeTitle', { name: app.name })}>
        <p>{t('appCard.removeBody')}</p>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
          <input type="checkbox" checked={deleteData} onChange={(e) => setDeleteData(e.target.checked)} />
          {t('appCard.removeData')}
        </label>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</button>
          <button
            className="btn btn--danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: app.id, deleteData }, { onSuccess: () => setConfirmOpen(false) })}
          >
            {t('appCard.removeConfirm')}
          </button>
        </div>
      </Modal>
    </>
  );
}
