import type { AiModelInfo } from './registry';

/**
 * curated model lists per vendor — pure data, safe to import in the browser (the byok
 * settings ui renders the model picker from this). ids are real, known-good model ids;
 * the settings ui also allows a custom id for anything newer.
 */

export const OPENAI_MODELS: AiModelInfo[] = [
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini', contextWindow: 128000, description: 'fast, cheap, good for most questions' },
  { id: 'gpt-4o', name: 'gpt-4o', contextWindow: 128000, description: 'strong general reasoning' },
  { id: 'gpt-4.1-mini', name: 'gpt-4.1-mini', contextWindow: 1047576, description: 'latest mini line, large context' },
  { id: 'gpt-4.1', name: 'gpt-4.1', contextWindow: 1047576, description: 'latest full model, best quality' },
];

export const ANTHROPIC_MODELS: AiModelInfo[] = [
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, description: 'fast and inexpensive' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', contextWindow: 200000, description: 'strong reasoning, long context' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 1000000, description: 'latest sonnet line' },
];

export const GOOGLE_MODELS: AiModelInfo[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1048576, description: 'fast, cheap, huge context' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576, description: 'strongest reasoning' },
];

export const ALL_MODELS: Record<string, AiModelInfo[]> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
};

/** the first-listed model per vendor is the sensible default. */
export const DEFAULT_MODEL: Record<string, string> = {
  openai: OPENAI_MODELS[0]?.id ?? 'gpt-4o-mini',
  anthropic: ANTHROPIC_MODELS[0]?.id ?? 'claude-3-5-haiku-20241022',
  google: GOOGLE_MODELS[0]?.id ?? 'gemini-2.5-flash',
};
