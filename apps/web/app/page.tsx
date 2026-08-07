'use client';

import Link from 'next/link';
import { Box, Button, MotionBox, Text, fadeOnly, fadeUp, staggerContainer, useReducedMotion } from '@screen-companion/ui';

/**
 * landing hero — first-time tier, the delight budget lives here (emil-design-eng):
 * a gentle staggered entrance, 50ms between elements, fade + 12px rise, decelerate.
 * reduced motion: opacity only.
 */
export default function LandingPage() {
  const reduce = useReducedMotion();
  const item = reduce ? fadeOnly() : fadeUp(12);

  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="3xl">
      <MotionBox
        initial="initial"
        animate="enter"
        variants={staggerContainer}
        display="flex"
        direction="column"
        gap="xl"
        maxWidth={640}
        width="100%"
        align="center"
      >
        <MotionBox variants={item} display="flex" direction="column" gap="m" align="center">
          <Text as="h1" size="display" weight="bold" align="center">
            Understand what you watch — never more than you asked for.
          </Text>
          <Text size="body-lg" color="content.secondary" align="center">
            Pick a movie or show, set how far into the story you want to know, and ask anything.
            Answers are grounded in real episode metadata and stop exactly at your spoiler
            boundary — on your phone, your browser, or your TV.
          </Text>
        </MotionBox>

        <MotionBox variants={item} display="flex" direction="row" wrap gap="m" justify="center">
          <Link href="/search">
            <Button size="l">Find a title</Button>
          </Link>
        </MotionBox>

        <MotionBox variants={item} display="flex" direction="row" wrap gap="xs" justify="center">
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
        </MotionBox>
      </MotionBox>
    </Box>
  );
}
