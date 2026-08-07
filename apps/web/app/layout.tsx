import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@screen-companion/design-tokens/browser.css';
import '@screen-companion/ui/ui.css';
import './globals.css';
import { ThemeToggle } from './components/theme-toggle';
import { Box } from '@screen-companion/ui';
import { Text } from '@screen-companion/ui';
import { Inline } from '@screen-companion/ui';
import { polysans, polysansWide } from './fonts';

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
      <body className={`${polysans.variable} ${polysansWide.variable}`}>
        <Box as="header" paddingX="xl" paddingY="m" border="border.subtle" borderWidth="thin" display="flex" direction="row" align="center" justify="between">
          <Inline gap="s" align="center">
            <Box width={8} height={8} radius="full" background="action.primary.default" />
            <Text size="title-sm" weight="bold">
              screen companion
            </Text>
          </Inline>
          <Inline gap="s" align="center">
            <Link href="/settings">
              <Text size="caption" color="content.secondary">
                provider
              </Text>
            </Link>
            <ThemeToggle />
          </Inline>
        </Box>
        {children}
      </body>
    </html>
  );
}
