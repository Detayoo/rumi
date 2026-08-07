'use client';

import type { ReactNode } from 'react';
import { MotionBox, useReducedMotion } from './motion-box';
import { pressSpring } from './motion-presets';
import type { BoxProps } from './Box';

/**
 * FocusRow — the tv-primary interactive row (§6.5), also used in browser list views for
 * consistency: a focusable Box row for search results, episode lists and settings rows.
 * this is the component responsible for making remote-control navigation work (req §11).
 * press feedback is a spring scale via motion (same contract as Button).
 */
export interface FocusRowProps extends BoxProps {
  children: ReactNode;
}

export function FocusRow({ children, ...rest }: FocusRowProps): ReactNode {
  const reduce = useReducedMotion();

  return (
    <MotionBox
      {...rest}
      focusable
      radius="s"
      padding="m"
      background="surface.sunken"
      display="flex"
      direction="row"
      align="center"
      gap="m"
      whileTap={!reduce ? { transform: 'scale(0.98)' } : undefined}
      transition={pressSpring}
    >
      {children}
    </MotionBox>
  );
}
