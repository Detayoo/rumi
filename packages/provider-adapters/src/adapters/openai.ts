import OpenAI from 'openai';
import type { AiVendorAdapter } from '../registry';
import { OPENAI_MODELS } from '../models';
import { askOpenAiCompatible, askOpenAiCompatibleStream } from './openai-compatible';

/**
 * openai adapter — the shared openai-compatible ask loop with strict json mode.
 * the spoiler boundary + retrieval filtering happen upstream (askCompanion).
 */

export const openaiAdapter: AiVendorAdapter = {
  vendor: 'openai',
  availableModels: OPENAI_MODELS,
  create(selection, apiKey) {
    const client = new OpenAI({ apiKey });
    return {
      name: `openai:${selection.model}`,
      ask(input) {
        return askOpenAiCompatible(client, selection.model, input, true);
      },
      askStream(input, callbacks) {
        return askOpenAiCompatibleStream(client, selection.model, input, callbacks, true);
      },
    };
  },
};
