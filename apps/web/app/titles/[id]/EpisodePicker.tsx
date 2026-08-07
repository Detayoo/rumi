'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Box, Button, Card, Chip, FocusRow, Stack, Text } from '@screen-companion/ui';
import type { EpisodeSummary } from '@screen-companion/types';
import { MockMetadataProvider } from '@screen-companion/provider-adapters';

/**
 * season → episode picker for tv titles. seasons are chips (active one inverted), episodes
 * are FocusRows; selecting an episode routes to the companion with season/episode params.
 * loading + empty states are first-class (§6).
 */

const metadata = new MockMetadataProvider();

interface EpisodePickerProps {
  titleId: string;
  titleName: string;
  seasons: number[];
}

export function EpisodePicker({ titleId, titleName, seasons }: EpisodePickerProps) {
  const router = useRouter();
  const [season, setSeason] = useState<number | null>(seasons[0] ?? null);
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (season === null) {
      setEpisodes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void metadata.getEpisodes(titleId, season).then((found) => {
      if (cancelled) return;
      setEpisodes(found);
      setSelectedEpisode(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [season, titleId]);

  const goToCompanion = () => {
    if (selectedEpisode === null) return;
    router.push(`/titles/${titleId}/companion?season=${selectedEpisode.season}&episode=${selectedEpisode.number}`);
  };

  return (
    <Stack gap="m">
      <Stack gap="2xs">
        <Text as="h2" size="title-sm" weight="semibold">
          Where are you in the story?
        </Text>
        <Text size="body-sm" color="content.secondary">
          Pick the season and episode you’re watching — this sets your spoiler boundary.
        </Text>
      </Stack>

      <Box display="flex" direction="row" wrap gap="xs" role="group" aria-label="season">
        {seasons.map((s) => (
          <Chip
            key={s}
            onPress={() => setSeason(s)}
            background={season === s ? 'action.primary.default' : 'surface.sunken'}
            color={season === s ? 'content.inverse' : 'content.secondary'}
          >
            Season {s}
          </Chip>
        ))}
      </Box>

      {loading && (
        <Card padding="l">
          <Text size="body-sm" color="content.secondary">
            Loading episodes…
          </Text>
        </Card>
      )}

      {!loading && episodes.length === 0 && (
        <Card padding="l">
          <Stack gap="xs" align="center">
            <Text size="title-sm" weight="semibold">
              No episodes yet
            </Text>
            <Text size="body-sm" color="content.secondary">
              Season {season} of {titleName} isn’t in our catalog yet.
            </Text>
          </Stack>
        </Card>
      )}

      {!loading && episodes.length > 0 && (
        <Stack gap="xs" role="list" aria-label="episodes">
          {episodes.map((episode) => (
            <FocusRow
              key={episode.id}
              role="listitem"
              aria-selected={selectedEpisode?.id === episode.id}
              onPress={() => setSelectedEpisode(episode)}
            >
              <Box minWidth={56}>
                <Text size="body-sm" weight="semibold" color="content.tertiary">
                  E{episode.number}
                </Text>
              </Box>
              <Stack gap="2xs" style={{ flex: 1 }}>
                <Text size="title-sm" weight="semibold">
                  {episode.name}
                </Text>
                {episode.synopsis !== null && (
                  <Text size="body-sm" color="content.secondary" maxLines={2}>
                    {episode.synopsis}
                  </Text>
                )}
              </Stack>
              <Text size="caption" color="content.tertiary">
                {selectedEpisode?.id === episode.id ? 'selected' : 'select'}
              </Text>
            </FocusRow>
          ))}
        </Stack>
      )}

      {selectedEpisode !== null && (
        <Button size="m" onPress={goToCompanion}>
          Ask about “{selectedEpisode.name}”
        </Button>
      )}
    </Stack>
  );
}
