import type { Metadata, Viewport } from 'next';
import '@screen-companion/design-tokens/browser.css';
import '@screen-companion/ui/ui.css';
import './globals.css';
import { ThemeToggle } from './components/theme-toggle';
import { Box } from '@screen-companion/ui';
import { Text } from '@screen-companion/ui';
import { Inline } from '@screen-companion/ui';

export const metadata: Metadata = {
  title: 'screen companion',
  description: 'A spoiler-aware AI companion for movies and TV. Ask questions, never learn more than you asked for.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0d' },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('sc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Box as="header" paddingX="xl" paddingY="m" border="border.subtle" borderWidth="thin" display="flex" direction="row" align="center" justify="between">
          <Inline gap="s" align="center">
            <Box width={8} height={8} radius="full" background="action.primary.default" />
            <Text size="title-sm" weight="bold">
              screen companion
            </Text>
          </Inline>
          <ThemeToggle />
        </Box>
        {children}
      </body>
    </html>
  );
}
