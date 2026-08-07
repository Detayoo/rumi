import Link from 'next/link';
import { Box, Card, Stack, Text } from '@screen-companion/ui';
import { MockMetadataProvider } from '@screen-companion/provider-adapters';
import { CompanionScreen } from './CompanionScreen';
import type { EpisodeSummary, TitleSummary } from '@screen-companion/types';

/**
 * companion route — /titles/[id]/companion?season=&episode= (requirements.md §6, §7).
 * server-side: resolves the title + episode from params (missing/invalid → first-class
 * empty state, per §6); the conversation itself lives in the client CompanionScreen.
 */

const metadata = new MockMetadataProvider();

export default async function CompanionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const title = await metadata.getTitle(id);
  if (title === null) {
    return (
      <Box display="flex" justify="center" paddingX="m" paddingY="xl">
        <Card padding="xl" maxWidth={480} width="100%">
          <Stack gap="s" align="center">
            <Text as="h1" size="title-md" weight="bold" align="center">
              Title not found
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

  let episode: EpisodeSummary | undefined;
  if (title.type === 'tv') {
    const season = query.season !== undefined ? Number(query.season) : NaN;
    const number = query.episode !== undefined ? Number(query.episode) : NaN;
    if (Number.isInteger(season) && Number.isInteger(number)) {
      episode = (await metadata.getEpisodes(title.id, season)).find((e) => e.number === number);
    }
  }

  if (title.type === 'tv' && episode === undefined) {
    return (
      <Box display="flex" justify="center" paddingX="m" paddingY="xl">
        <Card padding="xl" maxWidth={480} width="100%">
          <Stack gap="s" align="center">
            <Text as="h1" size="title-md" weight="bold" align="center">
              Choose an episode first
            </Text>
            <Text size="body-md" color="content.secondary" align="center">
              Pick where you are in {title.name} before asking anything — that sets your
              spoiler boundary.
            </Text>
            <Link href={`/titles/${title.id}`}>
              <Text size="body-sm" color="content.link">
                ← choose season and episode
              </Text>
            </Link>
          </Stack>
        </Card>
      </Box>
    );
  }

  return <CompanionScreen title={title} episode={episode} />;
}
