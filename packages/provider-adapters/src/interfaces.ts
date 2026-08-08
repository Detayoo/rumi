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
  getSeasons(titleId: string): Promise<number[]>;
  getEpisodes(titleId: string, season: number): Promise<EpisodeSummary[]>;
  /** retrievable chunks for the companion — filtered by spoiler boundary before use (§7.2) */
  getChunks(
    titleId: string,
    episode?: { season: number; number: number },
  ): Promise<RetrievalChunk[]>;
}

/** streamed deltas from a reasoning-capable model (deepseek reasoning_content, openai
 *  reasoning, anthropic thinking blocks, gemini thoughts). */
export interface AiStreamCallbacks {
  /** incremental reasoning text — safe to show live: never part of the json contract */
  onThinking?: (delta: string) => void;
  /** incremental answer text — raw model output, not yet contract-validated */
  onText?: (delta: string) => void;
}

export interface AiProviderInput {
  context: RequestContext;
  /** already filtered by the spoiler boundary — the provider must never receive out-of-boundary text (§7.2) */
  chunks: RetrievalChunk[];
}

export interface AiProvider {
  readonly name: string;
  ask(input: AiProviderInput): Promise<AiResponse>;
  /**
   * streaming variant — emits reasoning + answer deltas in real time and resolves with the
   * same validated response ask() returns. optional: providers without it fall back to ask().
   */
  askStream?(input: AiProviderInput, callbacks: AiStreamCallbacks): Promise<AiResponse>;
}
