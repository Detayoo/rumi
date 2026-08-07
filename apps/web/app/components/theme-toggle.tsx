'use client';

import { useEffect, useState } from 'react';
import { Box } from '@screen-companion/ui';
import { Text } from '@screen-companion/ui';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
    <Box
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
    >
      <Text size="caption" color="content.secondary">
        {theme === 'dark' ? 'light mode' : 'dark mode'}
      </Text>
    </Box>
  );
}
