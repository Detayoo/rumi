import type { ReactNode } from 'react';
import { Box, type BoxProps } from './Box';

export interface GridProps extends Omit<BoxProps, 'display'> {
  columns?: number;
}

/** grid — Box display="grid" with a fixed column count */
export function Grid({ columns = 1, gap = 'm', style, ...rest }: GridProps): ReactNode {
  return (
    <Box
      {...rest}
      display="grid"
      gap={gap}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}
    />
  );
}
