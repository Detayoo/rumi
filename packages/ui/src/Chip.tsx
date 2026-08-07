import type { ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import type { BackgroundToken } from '@screen-companion/design-tokens';

/**
 * Chip — a small pill: tight radius, dense padding, caption text (§3.2 example).
 * used for tags, badges and follow-up question suggestions.
 */
export interface ChipProps {
  background?: BackgroundToken;
  color?: 'content.primary' | 'content.secondary' | 'content.tertiary' | 'content.inverse';
  onPress?: () => void;
  children: ReactNode;
}

export function Chip(props: ChipProps): ReactNode {
  const { background = 'surface.sunken', color = 'content.secondary', onPress, children } = props;

  return (
    <Box
      as={onPress ? 'button' : 'div'}
      focusable={onPress !== undefined}
      onPress={onPress}
      radius="xs"
      paddingX="xs"
      paddingY="3xs"
      background={background}
      display="inline-flex"
      align="center"
      gap="2xs"
      border="border.subtle"
      borderWidth="thin"
    >
      <Text size="caption" color={color}>
        {children}
      </Text>
    </Box>
  );
}
