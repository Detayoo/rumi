'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * page transition — re-mounts on every navigation. navigation is a high-frequency
 * interaction, so this is a pure opacity fade, no movement, 150ms: it bridges the route
 * change without drawing attention to itself. reduced motion gets the same fade.
 */
export default function Template({ children }: { children: ReactNode }): ReactNode {
  const reduce = useReducedMotion();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.1 : 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
