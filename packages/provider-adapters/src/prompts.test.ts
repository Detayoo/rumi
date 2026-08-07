import { describe, expect, it } from 'vitest';
import { buildContextBlock, completeResponse, parseModelJson, spoilerBoundaryLine } from './prompts';
import type { RequestContext } from '@screen-companion/ai-contracts';
import { generalChunk, episodeChunk } from '@screen-companion/shared-utils';

const context: RequestContext = {
  title: { id: 'tv-severance', name: 'Severance', type: 'tv' },
  episode: { season: 1, number: 4, name: 'The You You Are' },
  spoilerBoundary: { mode: 'episode-only', maximumSeason: 1, maximumEpisode: 4 },
  language: 'en',
  question: 'Why is Mark behaving differently?',
};

describe('parseModelJson — the model output gate', () => {
  it('parses a clean json object', () => {
    expect(parseModelJson('{"answer":"a","containsSpoilers":false}')).toEqual({
      answer: 'a',
      containsSpoilers: false,
    });
  });

  it('strips markdown fences', () => {
    expect(parseModelJson('```json\n{"answer":"a"}\n```')).toEqual({ answer: 'a' });
  });

  it('extracts json embedded in prose (model rambling)', () => {
    const text = 'Sure! Here you go:\n{"answer":"a","confidence":"high"}\nHope that helps.';
    expect(parseModelJson(text)).toEqual({ answer: 'a', confidence: 'high' });
  });

  it('throws on prose without json', () => {
    expect(() => parseModelJson('I cannot answer that.')).toThrow();
  });
});

describe('completeResponse — contract stamping', () => {
  it('stamps the server-side boundary as spoilerLevelUsed, never the model\u2019s claim', () => {
    const parsed = {
      answer: 'x',
      containsSpoilers: true,
      confidence: 'high',
      followUpQuestions: ['q'],
      entities: [],
      spoilerLevelUsed: 'full-series', // a lying model — must be overridden
    };
    const response = completeResponse(parsed, context);
    expect(response.spoilerLevelUsed).toBe('episode-only');
  });

  it('rejects output missing contract fields', () => {
    expect(() => completeResponse({ answer: 'x' }, context)).toThrow();
  });
});

describe('spoilerBoundaryLine + buildContextBlock', () => {
  it('describes the boundary in the system prompt', () => {
    expect(spoilerBoundaryLine(context.spoilerBoundary)).toContain('up to and including season 1 episode 4');
  });

  it('labels chunks by scope as data', () => {
    const block = buildContextBlock([
      generalChunk('g', 'general info'),
      episodeChunk('e', 'episode info', 1, 4),
    ]);
    expect(block).toContain('[general] general info');
    expect(block).toContain('[episode S1E4] episode info');
  });
});
