'use client';

import { useEffect, useState } from 'react';
import { Box, Text, MotionBox, pressSpring, useReducedMotion } from '@screen-companion/ui';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const reduce = useReducedMotion();

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('sc-theme', next);
    } catch {
      // private mode — theme simply won't persist
    }
  };

  return (
    <MotionBox
      as="button"
      focusable
      onPress={toggle}
      radius="xs"
      paddingX="s"
      paddingY="2xs"
      background="surface.sunken"
      border="border.subtle"
      borderWidth="thin"
      aria-label={`switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      whileTap={!reduce ? { transform: 'scale(0.95)' } : undefined}
      transition={pressSpring}
    >
      <Text size="caption" color="content.secondary">
        {theme === 'dark' ? 'light mode' : 'dark mode'}
      </Text>
    </MotionBox>
  );
}
