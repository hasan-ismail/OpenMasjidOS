import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { springSoft } from '../lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Wider dialog. */
  wide?: boolean;
  children: ReactNode;
}

/**
 * A simple centered dialog for confirmations and short forms. Click the
 * backdrop or the corner X (or press Escape) to dismiss. Long-lived,
 * minimizable windows (terminals, logs, file viewers) are NOT modals — they
 * live in the window manager (see WindowManager.tsx).
 */
export function Modal({ open, onClose, title, wide, children }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal glass-raised"
            style={wide ? { width: 'min(60rem, 100%)' } : undefined}
            initial={{ opacity: 0, scale: 0.94, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: springSoft }}
            exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(6px)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              {title && <h2 className="modal-title">{title}</h2>}
              <button className="icon-btn modal-x" aria-label={t('common.close')} onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
