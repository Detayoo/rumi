import type { AiResponse } from '@screen-companion/ai-contracts';
import type { AiProvider, AiProviderInput } from './interfaces';

/**
 * in-memory ai provider — adr-0001: mock-first. returns schema-valid canned answers so the
 * full companion pipeline (retrieve → filter → validate) is exercisable end to end.
 * it deliberately does not "reason": answers are assembled from the already-filtered chunks
 * it receives, which makes it a useful integration oracle for the spoiler boundary.
 */

export class MockAiProvider implements AiProvider {
  readonly name = 'mock-ai';

  async ask(input: AiProviderInput): Promise<AiResponse> {
    const { context, chunks } = input;
    const episodeChunk = chunks.find((c) => c.scope?.kind === 'episode');
    const episodeLabel =
      context.episode !== undefined
        ? `season ${context.episode.season} episode ${context.episode.number}`
        : 'the selected episode';

    const answer = episodeChunk
      ? `Based on what is known by ${episodeLabel}: ${episodeChunk.text}.`
      : `I can only speak generally about ${context.title.name} within your spoiler boundary — no episode details are available at this level.`;

    return {
      answer,
      spoilerLevelUsed: context.spoilerBoundary.mode,
      containsSpoilers: context.spoilerBoundary.mode !== 'none',
      confidence: 'medium',
      followUpQuestions: [
        `Would you like a character-focused explanation for ${context.title.name}?`,
        'Would you like the events leading up to this point?',
      ],
      entities: [],
    };
  }
}
