'use client';

import type { ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Stack } from './Stack';
import { Button } from './Button';
import { MotionBox, useReducedMotion } from './motion-box';
import { scaleIn, fadeOnly } from './motion-presets';

/**
 * QrPairingPanel — full-screen pairing surface (design-system.md §6.8, req §10).
 * radius='l', surface.raised, generous padding since it's typically shown full-screen on tv.
 * the qr image is rendered from a provider-supplied url (generated server-side in phase 5);
 * the cancel action is a Button (focus-row equivalent on browser).
 * enters like a modal — centered scale, exempt from trigger-anchored origin (emil-design-eng).
 */
export interface QrPairingPanelProps {
  qrCodeUrl?: string | null;
  title?: string;
  subtitle?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function QrPairingPanel(props: QrPairingPanelProps): ReactNode {
  const { qrCodeUrl, title = 'Pair your TV', subtitle = 'Scan this code with your phone to connect', cancelLabel = 'Cancel pairing', onCancel } = props;
  const reduce = useReducedMotion();
  const entrance = reduce ? fadeOnly() : scaleIn;

  return (
    <MotionBox
      initial="initial"
      animate="enter"
      variants={entrance}
      radius="l"
      background="surface.raised"
      padding="xl"
      border="border.subtle"
      borderWidth="thin"
      maxWidth={480}
      width="100%"
      shadow="high"
    >
      <Stack gap="l" align="center">
        <Stack gap="xs" align="center">
          <Text as="h1" size="title-lg" weight="bold" align="center">
            {title}
          </Text>
          <Text size="body-md" color="content.secondary" align="center">
            {subtitle}
          </Text>
        </Stack>

        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="pairing QR code" width={240} height={240} style={{ borderRadius: 'var(--radius-s)' }} />
        ) : (
          <Box width={240} height={240} background="surface.sunken" radius="s" display="flex" align="center" justify="center">
            <Text size="caption" color="content.tertiary">
              QR code unavailable
            </Text>
          </Box>
        )}

        {onCancel !== undefined && (
          <Button variant="secondary" size="m" onPress={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </Stack>
    </MotionBox>
  );
}
