import type { RequestContext, AiResponse } from '@screen-companion/ai-contracts';
import type { RetrievalChunk } from '@screen-companion/shared-utils';
import type { EpisodeSummary, TitleSummary } from '@screen-companion/types';

/**
 * vendor abstraction layer — requirements.md §4, §7.7 and adr-0001.
 * application code depends on these interfaces, never on a vendor sdk.
 * swap the metadata or ai vendor by changing the factory, not the app.
 */

export interface MetadataProvider {
  readonly name: string;
  searchTitles(query: string, type?: 'movie' | 'tv'): Promise<TitleSummary[]>;
  getTitle(id: string): Promise<TitleSummary | null>;
  getEpisodes(titleId: string, season: number): Promise<EpisodeSummary[]>;
  /** retrievable chunks for the companion — filtered by spoiler boundary before use (§7.2) */
  getChunks(
    titleId: string,
    episode?: { season: number; number: number },
  ): Promise<RetrievalChunk[]>;
}

export interface AiProviderInput {
  context: RequestContext;
  /** already filtered by the spoiler boundary — the provider must never receive out-of-boundary text (§7.2) */
  chunks: RetrievalChunk[];
}

export interface AiProvider {
  readonly name: string;
  ask(input: AiProviderInput): Promise<AiResponse>;
}
