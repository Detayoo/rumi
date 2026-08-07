'use client';

import type { ReactNode } from 'react';
import { MotionBox, useReducedMotion } from './motion-box';
import { pressSpring } from './motion-presets';
import { Text } from './Text';

/**
 * Button — real behavior (press state, disabled, loading spinner swap, keyboard activation)
 * on top of a styled Box: radius='s', padding scaled to size, action.primary fill (§6.1).
 * press feedback is a spring scale via motion — instant, interruptible, no bounce.
 */

export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 's' | 'm' | 'l';
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
}

const PADDING: Record<'s' | 'm' | 'l', { y: '2xs' | 'xs' | 's'; x: 'm' | 'l' | 'xl' }> = {
  s: { y: '2xs', x: 'm' },
  m: { y: 'xs', x: 'l' },
  l: { y: 's', x: 'xl' },
};

export function Button(props: ButtonProps): ReactNode {
  const { variant = 'primary', size = 'm', onPress, disabled = false, loading = false, children, type = 'button' } = props;
  const reduce = useReducedMotion();

  const primary = variant === 'primary';
  const background = disabled
    ? 'action.primary.disabled'
    : primary
      ? 'action.primary.default'
      : 'action.secondary.default';
  const color = disabled
    ? 'content.tertiary'
    : primary
      ? 'content.inverse'
      : 'content.primary';

  return (
    <MotionBox
      as="button"
      type={type}
      focusable={!disabled}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      radius="s"
      paddingY={PADDING[size].y}
      paddingX={PADDING[size].x}
      background={background}
      border={primary ? undefined : 'border.default'}
      borderWidth="thin"
      className="sc-button"
      display="inline-flex"
      align="center"
      justify="center"
      gap="2xs"
      aria-busy={loading || undefined}
      whileTap={!disabled && !loading && !reduce ? { transform: 'scale(0.97)' } : undefined}
      transition={pressSpring}
    >
      {loading && <span className="sc-spinner" aria-hidden="true" />}
      <Text size={size === 'l' ? 'body-lg' : 'body-md'} weight="semibold" color={color}>
        {children}
      </Text>
    </MotionBox>
  );
}
