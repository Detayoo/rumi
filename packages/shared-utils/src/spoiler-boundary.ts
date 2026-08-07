import type { SpoilerBoundary } from '@screen-companion/ai-contracts';

/**
 * spoiler-boundary retrieval filter — requirements.md §7.2.
 *
 * this is the primary spoiler control, not the system prompt: chunks that fall outside the
 * boundary are removed BEFORE anything is sent to the model. the model never receives text it
 * isn't allowed to use, so a prompt-injection attempt can't leak it (defense in depth only).
 *
 * a "chunk" is a retrievable piece of metadata with a known story scope:
 *   general  — non-story-specific (genre, year, cast photos, overview without plot)
 *   episode  — a single episode's synopsis (has season + number)
 *   season   — a whole season's synopsis
 *   series   — spans the entire story (must only ever reach the model in full-series mode)
 */

export type ChunkStoryScope = 'general' | 'episode' | 'season' | 'series';

export interface RetrievalChunk {
  id: string;
  text: string;
  /** null = no story position attached (unverifiable) — treated as series scope, i.e. excluded unless full-series */
  scope:
    | { kind: 'general' }
    | { kind: 'episode'; season: number; episode: number }
    | { kind: 'season'; season: number }
    | { kind: 'series' }
    | null;
}

/**
 * does a single chunk fall within the boundary?
 * conservative by design: anything ambiguous at the boundary is excluded —
 * a false exclusion costs a slightly less rich answer; a false inclusion is a product failure.
 */
export function isWithinBoundary(chunk: RetrievalChunk, boundary: SpoilerBoundary): boolean {
  const { mode } = boundary;

  if (mode === 'full-series') return true;

  if (chunk.scope === null) return false; // unverifiable story position — never risk it

  if (chunk.scope.kind === 'general') return true; // allowed in every mode, including 'none'

  if (mode === 'none') return false; // no story-specific content at all

  if (chunk.scope.kind === 'series') return false; // only full-series may see it

  const maxSeason = boundary.maximumSeason;
  if (maxSeason === undefined) return false; // malformed/unspecified boundary — safest answer is no story content

  if (mode === 'season-only') {
    return chunk.scope.season <= maxSeason;
  }

  // episode-only: up to and including the selected episode
  if (chunk.scope.kind === 'season') {
    // a season-scoped chunk at exactly the boundary season may describe episodes beyond the
    // boundary — exclude it (conservative).
    return chunk.scope.season < maxSeason;
  }

  const { season, episode } = chunk.scope;
  if (season < maxSeason) return true;
  if (season > maxSeason) return false;
  const maxEpisode = boundary.maximumEpisode;
  if (maxEpisode === undefined) return false; // no episode cutoff given — stop before the season's content
  return episode <= maxEpisode;
}

/** returns the boundary-safe subset of chunks, preserving input order. */
export function filterByBoundary(
  chunks: readonly RetrievalChunk[],
  boundary: SpoilerBoundary,
): RetrievalChunk[] {
  return chunks.filter((chunk) => isWithinBoundary(chunk, boundary));
}

export function generalChunk(id: string, text: string): RetrievalChunk {
  return { id, text, scope: { kind: 'general' } };
}

export function episodeChunk(id: string, text: string, season: number, episode: number): RetrievalChunk {
  return { id, text, scope: { kind: 'episode', season, episode } };
}

export function seasonChunk(id: string, text: string, season: number): RetrievalChunk {
  return { id, text, scope: { kind: 'season', season } };
}

export function seriesChunk(id: string, text: string): RetrievalChunk {
  return { id, text, scope: { kind: 'series' } };
}
