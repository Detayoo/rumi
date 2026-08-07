import Link from 'next/link';
import { Box, Card, Stack, Text } from '@screen-companion/ui';
import { MockMetadataProvider } from '@screen-companion/provider-adapters';
import { EpisodePicker } from './EpisodePicker';

/**
 * title details — requirements.md §6. overview + "where are you in the story" picker.
 * seasons and episodes come from the metadata provider (mock-first); a tv title gets
 * the season → episode flow, a movie goes straight to the companion. not-found is a
 * first-class state (§6): never a bare 404.
 */

const metadata = new MockMetadataProvider();

export default async function TitleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = await metadata.getTitle(id);

  if (title === null) {
    return (
      <Box display="flex" justify="center" paddingX="m" paddingY="xl">
        <Card padding="xl" maxWidth={480} width="100%">
          <Stack gap="s" align="center">
            <Text as="h1" size="title-md" weight="bold" align="center">
              Title not found
            </Text>
            <Text size="body-md" color="content.secondary" align="center">
              We couldn’t find that title. It may not be in our catalog yet, or the link may
              be out of date.
            </Text>
            <Link href="/search">
              <Text size="body-sm" color="content.link">
                ← back to search
              </Text>
            </Link>
          </Stack>
        </Card>
      </Box>
    );
  }

  const seasons = title.type === 'tv' ? await metadata.getSeasons(title.id) : [];

  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="xl">
      <Stack gap="l" maxWidth={640} width="100%">
        <Link href="/search">
          <Text size="body-sm" color="content.link">
            ← back to search
          </Text>
        </Link>

        <Stack gap="2xs">
          <Text as="h1" size="title-lg" weight="bold">
            {title.name}
          </Text>
          <Text size="caption" color="content.tertiary">
            {title.type === 'tv' ? 'series' : 'movie'}
            {title.year !== null ? ` · ${title.year}` : ''}
          </Text>
        </Stack>

        {title.overview !== null && (
          <Text size="body-md" color="content.secondary">
            {title.overview}
          </Text>
        )}

        {title.type === 'tv' ? (
          <EpisodePicker titleId={title.id} titleName={title.name} seasons={seasons} />
        ) : (
          <Card padding="l">
            <Stack gap="s">
              <Text as="h2" size="title-sm" weight="semibold">
                Ask about {title.name}
              </Text>
              <Text size="body-sm" color="content.secondary">
                Choose how much of the story you want to know, then ask anything.
              </Text>
              <Link href={`/titles/${title.id}/companion`}>
                <Box display="inline-flex">
                  <Text size="body-md" weight="semibold" color="content.link">
                    Ask about this movie →
                  </Text>
                </Box>
              </Link>
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
