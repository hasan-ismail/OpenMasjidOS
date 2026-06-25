// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * First-load splash: a brief, skippable geometric assembly (<1s) honoring
 * CLAUDE.md §14. Also used as the auth-loading screen.
 */
import { motion } from 'motion/react';
import { MasjidMark } from './Glyphs';

export function Splash({ onSkip }: { onSkip?: () => void }) {
  return (
    <motion.div
      className="auth-wrap"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onSkip}
      style={{ cursor: onSkip ? 'pointer' : 'default' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ color: 'var(--color-primary)' }}
      >
        <MasjidMark size={72} />
      </motion.div>
    </motion.div>
  );
}
