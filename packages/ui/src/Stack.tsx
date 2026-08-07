import type { ReactNode } from 'react';
import { Box, type BoxProps } from './Box';

/** vertical stack — Box display="flex" direction="column" preset */
export function Stack(props: Omit<BoxProps, 'display' | 'direction'>): ReactNode {
  return <Box {...props} display="flex" direction="column" />;
}
