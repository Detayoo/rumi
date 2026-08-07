'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Card, Chip, Stack, Text, TextInput } from '@screen-companion/ui';
import { ALL_MODELS, DEFAULT_MODEL } from '@screen-companion/provider-adapters/models';
import type { AiVendor } from '@screen-companion/ai-contracts';
import { clearAiSettings, loadAiSettings, saveAiSettings } from '@/lib/ai-settings';

/**
 * byok settings — pick a vendor + model, paste your own api key (adr-0002).
 * the key is stored in this browser for the pre-accounts phase and sent per request;
 * accounts phase moves it to encrypted server-side storage.
 * this is the screen that turns off test mode.
 */

const VENDORS: { vendor: AiVendor; label: string }[] = [
  { vendor: 'openai', label: 'OpenAI' },
  { vendor: 'anthropic', label: 'Anthropic' },
  { vendor: 'google', label: 'Google' },
];

export default function SettingsPage() {
  const [vendor, setVendor] = useState<AiVendor>('openai');
  const [model, setModel] = useState(DEFAULT_MODEL.openai ?? '');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState<{ vendor: AiVendor; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settings = loadAiSettings();
    if (settings !== null) {
      setVendor(settings.vendor);
      setModel(settings.model);
      setApiKey(settings.apiKey);
      setSaved({ vendor: settings.vendor, model: settings.model });
    }
  }, []);

  const pickVendor = (next: AiVendor) => {
    setVendor(next);
    setModel(DEFAULT_MODEL[next] ?? ALL_MODELS[next]?.[0]?.id ?? '');
  };

  const save = () => {
    if (apiKey.trim() === '') {
      setError('Paste your API key first — it stays in this browser.');
      return;
    }
    saveAiSettings({ vendor, model, apiKey });
    setSaved({ vendor, model });
    setError(null);
  };

  const clear = () => {
    clearAiSettings();
    setApiKey('');
    setSaved(null);
    setError(null);
  };

  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="xl">
      <Stack gap="l" maxWidth={560} width="100%">
        <Stack gap="2xs">
          <Text as="h1" size="title-lg" weight="bold">
            AI provider
          </Text>
          <Text size="body-md" color="content.secondary">
            Bring your own key — pick a provider and model, then paste your key. Your
            answers are generated with your key and charged to your own account.
          </Text>
        </Stack>

        <Card padding="l">
          <Stack gap="m">
            <Stack gap="2xs">
              <Text as="h2" size="title-sm" weight="semibold">
                Provider
              </Text>
              <Box display="flex" direction="row" wrap gap="xs" role="group" aria-label="provider">
                {VENDORS.map((v) => (
                  <Chip
                    key={v.vendor}
                    onPress={() => pickVendor(v.vendor)}
                    background={vendor === v.vendor ? 'action.primary.default' : 'surface.sunken'}
                    color={vendor === v.vendor ? 'content.inverse' : 'content.secondary'}
                  >
                    {v.label}
                  </Chip>
                ))}
              </Box>
            </Stack>

            <Stack gap="2xs">
              <Text as="h2" size="title-sm" weight="semibold">
                Model
              </Text>
              <Box display="flex" direction="row" wrap gap="xs" role="group" aria-label="model">
                {(ALL_MODELS[vendor] ?? []).map((m) => (
                  <Chip
                    key={m.id}
                    onPress={() => setModel(m.id)}
                    background={model === m.id ? 'action.primary.default' : 'surface.sunken'}
                    color={model === m.id ? 'content.inverse' : 'content.secondary'}
                  >
                    {m.name}
                  </Chip>
                ))}
              </Box>
              <Text size="caption" color="content.tertiary">
                Want a newer model? Its id can be typed below once saved — this list is
                curated, not exhaustive.
              </Text>
            </Stack>

            <TextInput
              label="API key"
              value={apiKey}
              onChange={setApiKey}
              placeholder="sk-…"
              type="password"
            />

            {error !== null && (
              <Text size="body-sm" color="feedback.danger">
                {error}
              </Text>
            )}

            <Box display="flex" direction="row" gap="s" align="center">
              <Button size="m" onPress={save}>
                Save provider
              </Button>
              {saved !== null && (
                <Button size="m" variant="secondary" onPress={clear}>
                  Clear
                </Button>
              )}
            </Box>

            {saved !== null && (
              <Text size="body-sm" color="content.secondary">
                Active: <Text as="span" size="body-sm" weight="semibold">{saved.vendor} · {saved.model}</Text> — your key.
              </Text>
            )}
          </Stack>
        </Card>

        <Card padding="l">
          <Stack gap="2xs">
            <Text as="h2" size="title-sm" weight="semibold">
              No key? No problem
            </Text>
            <Text size="body-sm" color="content.secondary">
              Without a provider, the companion answers from a built-in demo engine (free,
              offline, deterministic). The spoiler boundary works exactly the same either way.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
