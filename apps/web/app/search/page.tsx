'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { Box, Button, Card, FocusRow, MotionBox, Stack, Text, TextInput, fadeOnly, fadeUp, staggerContainer, useReducedMotion } from '@screen-companion/ui';
import type { TitleSummary } from '@screen-companion/types';
import { MockMetadataProvider } from '@screen-companion/provider-adapters/mock';

/**
 * search screen (phase 1 shell) — queries the in-memory mock metadata provider directly.
 * phase 2 swaps this for the real /api/v1/titles/search endpoint via ApiClient.
 * loading / empty / error states are first-class, per requirements.md §6.
 * results stagger in (50ms apart) — results appear on demand, so a short cascade reads
 * as spatial consistency, not decoration; reduced motion: opacity only.
 */

type SearchState = 'idle' | 'loading' | 'success' | 'error';

const metadataProvider = new MockMetadataProvider();

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TitleSummary[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const reduce = useReducedMotion();
  const item = reduce ? fadeOnly() : fadeUp(6);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setState('idle');
      return;
    }
    const seq = ++requestSeq.current;
    setState('loading');
    setError(null);
    try {
      const found = await metadataProvider.searchTitles(trimmed);
      if (seq !== requestSeq.current) return; // a newer search superseded this one
      setResults(found);
      setState('success');
    } catch (cause) {
      if (seq !== requestSeq.current) return;
      setError(cause instanceof Error ? cause.message : 'Something went wrong searching titles.');
      setState('error');
    }
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="xl">
      <Stack gap="l" maxWidth={640} width="100%">
        <Stack gap="2xs">
          <Text as="h1" size="title-lg" weight="bold">
            Search titles
          </Text>
          <Text size="body-md" color="content.secondary">
            Find a movie or series, then pick where in the story you are.
          </Text>
        </Stack>

        <Box as="form" onSubmit={handleSubmit} display="flex" direction="row" gap="s" align="end">
          <Box style={{ flex: 1 }}>
            <TextInput
              label="Title"
              value={query}
              onChange={setQuery}
              placeholder="Try “severance”"
              type="search"
              autoFocus
            />
          </Box>
          <Button type="submit" disabled={state === 'loading'}>
            {state === 'loading' ? 'Searching' : 'Search'}
          </Button>
        </Box>

        {state === 'loading' && (
          <MotionBox initial="initial" animate="enter" variants={item}>
            <Card padding="l">
              <Text size="body-md" color="content.secondary">
                Searching…
              </Text>
            </Card>
          </MotionBox>
        )}

        {state === 'error' && (
          <MotionBox initial="initial" animate="enter" variants={item}>
            <Card padding="l" border="feedback.danger">
              <Stack gap="s">
                <Text size="body-md" color="feedback.danger">
                  {error}
                </Text>
                <Button variant="secondary" size="s" onPress={() => void runSearch(query)}>
                  Try again
                </Button>
              </Stack>
            </Card>
          </MotionBox>
        )}

        {state === 'success' && results.length === 0 && (
          <MotionBox initial="initial" animate="enter" variants={item}>
            <Card padding="l">
              <Stack gap="xs" align="center">
                <Text as="h2" size="title-sm" weight="semibold">
                  No titles found
                </Text>
                <Text size="body-sm" color="content.secondary">
                  Nothing matched “{query}”. Try a different title, or check the spelling.
                </Text>
              </Stack>
            </Card>
          </MotionBox>
        )}

        {state === 'success' && results.length > 0 && (
          <MotionBox
            key={query.trim()}
            initial="initial"
            animate="enter"
            variants={staggerContainer}
            display="flex"
            direction="column"
            gap="xs"
            role="list"
            aria-label="search results"
          >
            {results.map((title) => (
              <MotionBox key={title.id} variants={item} role="listitem">
                <FocusRow onPress={() => router.push(`/titles/${title.id}`)}>
                  <Stack gap="2xs" style={{ flex: 1 }}>
                    <Text size="title-sm" weight="semibold">
                      {title.name}
                    </Text>
                    <Text size="body-sm" color="content.secondary">
                      {title.type === 'tv' ? 'series' : 'movie'}
                      {title.year !== null ? ` · ${title.year}` : ''}
                    </Text>
                  </Stack>
                  <Text size="caption" color="content.tertiary">
                    open
                  </Text>
                </FocusRow>
              </MotionBox>
            ))}
          </MotionBox>
        )}
      </Stack>
    </Box>
  );
}
