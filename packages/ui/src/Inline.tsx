import type { ReactNode } from 'react';
import { Box, type BoxProps } from './Box';

/** horizontal row — Box display="flex" direction="row" preset */
export function Inline(props: Omit<BoxProps, 'display' | 'direction'>): ReactNode {
  return <Box {...props} display="flex" direction="row" />;
}
