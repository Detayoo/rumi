import type { ReactNode } from 'react';
import { Box, type BoxProps } from './Box';

/**
 * FocusRow — the tv-primary interactive row (§6.5), also used in browser list views for
 * consistency: a focusable Box row for search results, episode lists and settings rows.
 * this is the component responsible for making remote-control navigation work (req §11).
 */
export interface FocusRowProps extends BoxProps {
  children: ReactNode;
}

export function FocusRow({ children, ...rest }: FocusRowProps): ReactNode {
  return (
    <Box
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
    </Box>
  );
}
