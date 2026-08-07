import Link from 'next/link';
import { Box, Button, Stack, Text } from '@screen-companion/ui';

export default function LandingPage() {
  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="3xl">
      <Stack gap="xl" maxWidth={640} width="100%" align="center">
        <Stack gap="m" align="center">
          <Text as="h1" size="display" weight="bold" align="center">
            Understand what you watch — never more than you asked for.
          </Text>
          <Text size="body-lg" color="content.secondary" align="center">
            Pick a movie or show, set how far into the story you want to know, and ask anything.
            Answers are grounded in real episode metadata and stop exactly at your spoiler
            boundary — on your phone, your browser, or your TV.
          </Text>
        </Stack>

        <Box display="flex" direction="row" wrap gap="m" justify="center">
          <Link href="/search">
            <Button size="l">Find a title</Button>
          </Link>
        </Box>

        <Box display="flex" direction="row" wrap gap="xs" justify="center">
          {['general only', 'episode-only', 'season-only', 'full-series'].map((mode) => (
            <Box
              key={mode}
              radius="xs"
              paddingX="xs"
              paddingY="3xs"
              background="surface.sunken"
              border="border.subtle"
              borderWidth="thin"
            >
              <Text size="caption" color="content.secondary">
                {mode}
              </Text>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
