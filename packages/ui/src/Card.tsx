import type { ReactNode } from 'react';
import { Box, type BoxProps } from './Box';

/**
 * Card — a styled Box preset (§6.2): radius='m', surface.raised, shadow='low' on browser.
 * on tv the shadow token resolves to none (tv.css) — separation comes from the subtle
 * border, which is what §2.5 prescribes instead of shadows on physical panels.
 */
export interface CardProps extends BoxProps {
  children: ReactNode;
}

export function Card({ children, ...rest }: CardProps): ReactNode {
  return (
    <Box
      {...rest}
      radius="m"
      background="surface.raised"
      shadow="low"
      border="border.subtle"
      borderWidth="thin"
    >
      {children}
    </Box>
  );
}
