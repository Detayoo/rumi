import { describe, expect, it } from 'vitest';
import {
  episodeChunk,
  filterByBoundary,
  generalChunk,
  isWithinBoundary,
  seasonChunk,
  seriesChunk,
  type RetrievalChunk,
} from './spoiler-boundary';

/**
 * spoiler-boundary adversarial tests — requirements.md §14/§17.
 * written BEFORE any answer-rendering ui: a bug here is a product failure, not a bug.
 *
 * the invariant under test: content at or beyond the boundary must never pass the filter,
 * even under adversarial phrasing of the *question* (the question is not part of this filter —
 * the chunk set is filtered regardless of what the user asked).
 */

const boundaryEpisodeOnly = { mode: 'episode-only', maximumSeason: 1, maximumEpisode: 4 } as const;
const boundarySeasonOnly = { mode: 'season-only', maximumSeason: 2 } as const;
const boundaryNone = { mode: 'none' } as const;
const boundaryFullSeries = { mode: 'full-series' } as const;

const corpus: RetrievalChunk[] = [
  generalChunk('g1', 'severance is a mystery thriller about corporate employees.'),
  episodeChunk('e1-4', 'mark learns about the outie world in season 1 episode 4.', 1, 4),
  episodeChunk('e1-5', 'a character is revealed to be a mole in season 1 episode 5.', 1, 5),
  episodeChunk('e2-1', 'mark quits lumon in season 2 episode 1.', 2, 1),
  episodeChunk('e3-8', 'the finale resolves the cold harbor project.', 3, 8),
  seasonChunk('s1', 'in season 1, the severed floor is introduced.', 1),
  seasonChunk('s2', 'in season 2, mark rejoins lumon.', 2),
  seasonChunk('s3', 'in season 3, the innies escape.', 3),
  seriesChunk('series', 'the full story: severed employees rebel and the cold harbor project is destroyed.'),
  { id: 'unverifiable', text: 'spoiler text with no position metadata.', scope: null },
];

describe('isWithinBoundary — episode-only at s1e4', () => {
  it('includes the selected episode itself (inclusive boundary)', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 4), boundaryEpisodeOnly)).toBe(true);
  });

  it('excludes the very next episode', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 5), boundaryEpisodeOnly)).toBe(false);
  });

  it('excludes everything in later seasons', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 2, 1), boundaryEpisodeOnly)).toBe(false);
    expect(isWithinBoundary(episodeChunk('x', 't', 3, 8), boundaryEpisodeOnly)).toBe(false);
  });

  it('includes earlier episodes and earlier seasons', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 3), boundaryEpisodeOnly)).toBe(true);
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 1), boundaryEpisodeOnly)).toBe(true);
  });

  it('excludes a season-scoped chunk at exactly the boundary season (may cover later episodes)', () => {
    expect(isWithinBoundary(seasonChunk('x', 't', 1), boundaryEpisodeOnly)).toBe(false);
  });

  it('includes season-scoped chunks for strictly earlier seasons', () => {
    expect(isWithinBoundary(seasonChunk('x', 't', 0), boundaryEpisodeOnly)).toBe(true);
  });

  it('excludes full-series overview chunks', () => {
    expect(isWithinBoundary(seriesChunk('x', 't'), boundaryEpisodeOnly)).toBe(false);
  });

  it('includes general non-story chunks', () => {
    expect(isWithinBoundary(generalChunk('x', 't'), boundaryEpisodeOnly)).toBe(true);
  });

  it('excludes chunks with no verifiable story position', () => {
    expect(isWithinBoundary({ id: 'x', text: 't', scope: null }, boundaryEpisodeOnly)).toBe(false);
  });
});

describe('isWithinBoundary — season-only at s2', () => {
  it('includes episodes up to the end of season 2', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 9), boundarySeasonOnly)).toBe(true);
    expect(isWithinBoundary(episodeChunk('x', 't', 2, 8), boundarySeasonOnly)).toBe(true);
  });

  it('includes season-scoped chunks up to season 2', () => {
    expect(isWithinBoundary(seasonChunk('x', 't', 2), boundarySeasonOnly)).toBe(true);
  });

  it('excludes season 3 content', () => {
    expect(isWithinBoundary(episodeChunk('x', 't', 3, 1), boundarySeasonOnly)).toBe(false);
    expect(isWithinBoundary(seasonChunk('x', 't', 3), boundarySeasonOnly)).toBe(false);
  });

  it('excludes full-series chunks', () => {
    expect(isWithinBoundary(seriesChunk('x', 't'), boundarySeasonOnly)).toBe(false);
  });
});

describe('isWithinBoundary — none', () => {
  it('allows only general, non-story-specific chunks', () => {
    expect(isWithinBoundary(generalChunk('x', 't'), boundaryNone)).toBe(true);
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 1), boundaryNone)).toBe(false);
    expect(isWithinBoundary(seasonChunk('x', 't', 1), boundaryNone)).toBe(false);
    expect(isWithinBoundary(seriesChunk('x', 't'), boundaryNone)).toBe(false);
  });
});

describe('isWithinBoundary — full-series', () => {
  it('allows everything, including series overview chunks', () => {
    expect(isWithinBoundary(seriesChunk('x', 't'), boundaryFullSeries)).toBe(true);
    expect(isWithinBoundary(episodeChunk('x', 't', 3, 8), boundaryFullSeries)).toBe(true);
    expect(isWithinBoundary({ id: 'x', text: 't', scope: null }, boundaryFullSeries)).toBe(true);
  });
});

describe('isWithinBoundary — malformed/underspecified boundaries', () => {
  it('missing maximumSeason passes no story content (fail closed)', () => {
    const boundary = { mode: 'episode-only' } as const;
    expect(isWithinBoundary(generalChunk('x', 't'), boundary)).toBe(true);
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 1), boundary)).toBe(false);
    expect(isWithinBoundary(seasonChunk('x', 't', 1), boundary)).toBe(false);
  });

  it('missing maximumEpisode excludes the boundary season\u2019s episodes (fail closed)', () => {
    const boundary = { mode: 'episode-only', maximumSeason: 1 } as const;
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 1), boundary)).toBe(false);
    expect(isWithinBoundary(episodeChunk('x', 't', 1, 4), boundary)).toBe(false);
  });
});

describe('filterByBoundary — adversarial retrieval', () => {
  /**
   * §14 adversarial cases: a user asks a question that can ONLY be answered with content
   * beyond the boundary. the filter does not care what the question says — it drops the
   * content regardless, so the model is structurally unable to answer from it.
   */
  it('"reveal the season finale" style questions still get an episode-only corpus', () => {
    const allowed = filterByBoundary(corpus, boundaryEpisodeOnly);
    const ids = allowed.map((c) => c.id);
    expect(ids).toContain('g1');
    expect(ids).toContain('e1-4');
    expect(ids).not.toContain('e1-5');
    expect(ids).not.toContain('e2-1');
    expect(ids).not.toContain('e3-8');
    expect(ids).not.toContain('s1'); // season overview at boundary season — may exceed e4
    expect(ids).not.toContain('s2');
    expect(ids).not.toContain('s3');
    expect(ids).not.toContain('series');
    expect(ids).not.toContain('unverifiable');
  });

  it('season-only corpus contains seasons 1–2 but nothing beyond', () => {
    const ids = filterByBoundary(corpus, boundarySeasonOnly).map((c) => c.id);
    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
    expect(ids).toContain('e2-1');
    expect(ids).not.toContain('s3');
    expect(ids).not.toContain('e3-8');
    expect(ids).not.toContain('series');
  });

  it('none-mode corpus is general-only', () => {
    const ids = filterByBoundary(corpus, boundaryNone).map((c) => c.id);
    expect(ids).toEqual(['g1']);
  });

  it('full-series corpus is the whole corpus', () => {
    expect(filterByBoundary(corpus, boundaryFullSeries).map((c) => c.id)).toHaveLength(
      corpus.length,
    );
  });

  it('preserves input order in the filtered result', () => {
    const allowed = filterByBoundary(corpus, boundarySeasonOnly).map((c) => c.id);
    expect(allowed).toEqual(
      corpus.filter((c) => isWithinBoundary(c, boundarySeasonOnly)).map((c) => c.id),
    );
  });

  it('does not mutate the input corpus', () => {
    const snapshot = JSON.stringify(corpus);
    filterByBoundary(corpus, boundaryEpisodeOnly);
    expect(JSON.stringify(corpus)).toBe(snapshot);
  });
});
