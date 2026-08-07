'use client';

import type { ReactNode } from 'react';
import { MotionBox } from './motion-box';
import type { BoxProps } from './Box';

/**
 * FocusRow — the tv-primary interactive row (§6.5), also used in browser list views for
 * consistency: a focusable Box row for search results, episode lists and settings rows.
 * this is the component responsible for making remote-control navigation work (req §11).
 *
 * no press-scale on purpose: rows navigate, and movement on a high-frequency interaction
 * reads as noise (emil-design-eng). the focus ring is the feedback.
 */
export interface FocusRowProps extends BoxProps {
  children: ReactNode;
}

export function FocusRow({ children, ...rest }: FocusRowProps): ReactNode {
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
    >
      {children}
    </MotionBox>
  );
}
