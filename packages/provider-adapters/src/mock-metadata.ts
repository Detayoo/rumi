import { generalChunk, seriesChunk, episodeChunk, type RetrievalChunk } from '@screen-companion/shared-utils';
import type { EpisodeSummary, TitleSummary } from '@screen-companion/types';
import type { MetadataProvider } from './interfaces';

/**
 * in-memory metadata provider — adr-0001: mock-first. seed data only, shaped like the
 * real provider contract so swapping in a real vendor touches no application code.
 */

interface MockTitle extends TitleSummary {
  episodeSeasons: Record<number, EpisodeSummary[]>;
}

const severanceEpisodes: Record<number, EpisodeSummary[]> = {
  1: [
    { id: 'ep-1-1', externalId: 'sev-1-1', titleId: 'tv-severance', season: 1, number: 1, name: 'Good News About Hell', synopsis: 'Mark returns to Lumon after a grief counseling session.' },
    { id: 'ep-1-2', externalId: 'sev-1-2', titleId: 'tv-severance', season: 1, number: 2, name: 'Half Loop', synopsis: 'Helly attempts to resign and learns the severance procedure is not easily undone.' },
    { id: 'ep-1-3', externalId: 'sev-1-3', titleId: 'tv-severance', season: 1, number: 3, name: 'In Perpetuity', synopsis: 'The Macrodata Refinement team meets an unexpected new face.' },
    { id: 'ep-1-4', externalId: 'sev-1-4', titleId: 'tv-severance', season: 1, number: 4, name: 'The You You Are', synopsis: 'Mark spends a day outside work following a mysterious lead.' },
    { id: 'ep-1-5', externalId: 'sev-1-5', titleId: 'tv-severance', season: 1, number: 5, name: 'The Grim Barbarity of Optics and Design', synopsis: 'The team visits the Optics and Design department.' },
    { id: 'ep-1-6', externalId: 'sev-1-6', titleId: 'tv-severance', season: 1, number: 6, name: 'Hide and Seek', synopsis: "Mark's outie investigates a former Lumon employee." },
    { id: 'ep-1-7', externalId: 'sev-1-7', titleId: 'tv-severance', season: 1, number: 7, name: 'Defiant Jazz', synopsis: 'A music dance experience gives the team a chance to pass a message.' },
    { id: 'ep-1-8', externalId: 'sev-1-8', titleId: 'tv-severance', season: 1, number: 8, name: "What's for Dinner?", synopsis: 'The board makes a sudden decision about the severed floor.' },
    { id: 'ep-1-9', externalId: 'sev-1-9', titleId: 'tv-severance', season: 1, number: 9, name: 'The We We Are', synopsis: 'The team executes a plan that blurs the line between innie and outie.' },
  ],
  2: [
    { id: 'ep-2-1', externalId: 'sev-2-1', titleId: 'tv-severance', season: 2, number: 1, name: 'Hello, Ms. Cobel', synopsis: 'The severed floor reopens with a new team and lingering questions.' },
    { id: 'ep-2-2', externalId: 'sev-2-2', titleId: 'tv-severance', season: 2, number: 2, name: 'Goodbye, Mrs. Selvig', synopsis: "Mark investigates his neighbor's true identity." },
  ],
  3: [
    { id: 'ep-3-1', externalId: 'sev-3-1', titleId: 'tv-severance', season: 3, number: 1, name: 'Cold Harbor', synopsis: 'The innies finally learn what Cold Harbor was for.' },
  ],
};

const titles: MockTitle[] = [
  {
    id: 'tv-severance',
    externalId: 'tmdb-1234',
    name: 'Severance',
    type: 'tv',
    year: 2022,
    posterUrl: null,
    overview: 'Mark leads a team of office workers whose memories are surgically divided between work and personal lives.',
    episodeSeasons: severanceEpisodes,
  },
];

export class MockMetadataProvider implements MetadataProvider {
  readonly name = 'mock-metadata';

  async searchTitles(query: string, type?: 'movie' | 'tv'): Promise<TitleSummary[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return titles
      .filter((t) => (type === undefined || t.type === type) && t.name.toLowerCase().includes(q))
      .map(({ episodeSeasons: _episodes, ...summary }) => summary);
  }

  async getTitle(id: string): Promise<TitleSummary | null> {
    const title = titles.find((t) => t.id === id);
    if (!title) return null;
    const { episodeSeasons: _episodes, ...summary } = title;
    return summary;
  }

  async getEpisodes(titleId: string, season: number): Promise<EpisodeSummary[]> {
    return titles.find((t) => t.id === titleId)?.episodeSeasons[season] ?? [];
  }

  /**
   * returns the full retrievable corpus — the spoiler boundary is the ONLY narrowing
   * control (req §7.2: filter before the model, never at provider level), so the mock
   * intentionally does not pre-filter by the focused episode.
   */
  async getChunks(
    titleId: string,
    _episode?: { season: number; number: number },
  ): Promise<RetrievalChunk[]> {
    const title = titles.find((t) => t.id === titleId);
    if (!title) return [];

    const chunks: RetrievalChunk[] = [
      generalChunk(`${titleId}-general`, `${title.name} (${title.year}) — ${title.overview}`),
    ];

    for (const [seasonStr, episodes] of Object.entries(title.episodeSeasons)) {
      const season = Number(seasonStr);
      for (const ep of episodes) {
        chunks.push(
          episodeChunk(
            `ep-${ep.season}-${ep.number}`,
            `S${ep.season}E${ep.number} ${ep.name}: ${ep.synopsis}`,
            ep.season,
            ep.number,
          ),
        );
      }
    }

    chunks.push(seriesChunk(`${titleId}-series`, `${title.name} — the complete story across all seasons.`));

    return chunks;
  }
}
