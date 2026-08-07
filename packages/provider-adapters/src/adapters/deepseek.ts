import OpenAI from 'openai';
import type { AiProvider } from '../interfaces';
import type { AiVendorAdapter } from '../registry';
import { DEEPSEEK_MODELS } from '../models';
import { askOpenAiCompatible } from './openai-compatible';

/**
 * deepseek adapter — deepseek speaks the openai wire protocol at api.deepseek.com, so the
 * shared openai-compatible ask loop does the work. one deviation: deepseek-reasoner does
 * not support json_object response format, so jsonMode is disabled for it and the prompt
 * instruction alone drives the json contract. the v4 flash model keeps full json mode.
 */

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export const deepseekAdapter: AiVendorAdapter = {
  vendor: 'deepseek',
  availableModels: DEEPSEEK_MODELS,
  create(selection, apiKey) {
    const client = new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
    const jsonMode = selection.model !== 'deepseek-reasoner';
    const provider: AiProvider = {
      name: `deepseek:${selection.model}`,
      ask(input) {
        return askOpenAiCompatible(client, selection.model, input, jsonMode);
      },
    };
    return provider;
  },
};
