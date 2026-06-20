import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeRise } from '../lib/motion';

/** Wraps a route's content with the gentle crossfade + rise entrance. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={fadeRise} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}
