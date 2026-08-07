'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * page transition — re-mounts on every navigation, so each route fades up as it enters.
 * purpose: preventing a jarring change between routes. a short rise, decelerate easing,
 * never more than 250ms. reduced motion keeps the fade, drops the movement.
 */
export default function Template({ children }: { children: ReactNode }): ReactNode {
  const reduce = useReducedMotion();

  return (
    <motion.main
      initial={{ opacity: 0, transform: reduce ? undefined : 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: reduce ? 0.15 : 0.25, ease: reduce ? 'easeOut' : [0, 0, 0, 1] }}
    >
      {children}
    </motion.main>
  );
}
