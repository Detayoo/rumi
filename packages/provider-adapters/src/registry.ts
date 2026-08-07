import type { AiProviderSelection, AiVendor } from '@screen-companion/ai-contracts';
import type { AiProvider } from './interfaces';
import { MockAiProvider } from './mock-ai';
import { openaiAdapter } from './adapters/openai';
import { anthropicAdapter } from './adapters/anthropic';
import { googleAdapter } from './adapters/google';
import { deepseekAdapter } from './adapters/deepseek';

/**
 * byok (bring-your-own-key) provider registry — adr-0002, requirements.md §7.7.
 *
 * the end state: a user picks a vendor + model in the app and provides their own api key;
 * the server stores it encrypted and resolves the provider per request from that config.
 * today the seam is exercised two ways: env vars (SC_AI_VENDOR / SC_AI_MODEL /
 * SC_AI_API_KEY) for a product-owned default, and an on-the-wire apiKey from the
 * pre-accounts byok settings (used for that request only, never stored). when the accounts
 * phase lands, resolveAiProvider gains a user-config variant that returns the exact same
 * AiProvider shape — application code never changes.
 *
 * adapters are registered here, one per vendor. 'mock' is the default so the app runs with
 * zero keys and zero cost; a configured-but-unregistered vendor fails loudly rather than
 * silently answering from the mock (a user who expects gpt must not get canned text).
 */

export interface AiModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  description?: string;
}

export interface AiVendorAdapter {
  vendor: AiVendor;
  /** models this adapter can serve — drives the model picker in the byok settings ui */
  availableModels: AiModelInfo[];
  create(selection: AiProviderSelection, apiKey: string): AiProvider;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderNotConfiguredError';
  }
}

const MOCK_VENDOR: AiVendorAdapter = {
  vendor: 'mock',
  availableModels: [{ id: 'mock-inmemory', name: 'In-memory mock (no key, no cost)', description: 'Deterministic canned answers — the default until a real key is configured.' }],
  create() {
    return new MockAiProvider();
  },
};

/** register a real vendor adapter here (e.g. an openai adapter wrapping the openai sdk). */
const registry: Partial<Record<AiVendor, AiVendorAdapter>> = {
  mock: MOCK_VENDOR,
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  deepseek: deepseekAdapter,
};

export function listSupportedVendors(): AiVendorAdapter[] {
  return Object.values(registry).filter((adapter): adapter is AiVendorAdapter => adapter !== undefined);
}

export function getVendorAdapter(vendor: AiVendor): AiVendorAdapter | undefined {
  return registry[vendor];
}

export function createAiProvider(selection: AiProviderSelection, apiKey?: string): AiProvider {
  const adapter = registry[selection.vendor];
  if (adapter === undefined) {
    throw new ProviderNotConfiguredError(`ai vendor "${selection.vendor}" is not configured.`);
  }
  if (adapter.vendor === 'mock') return adapter.create(selection, apiKey ?? '');
  if (apiKey === undefined || apiKey === '') {
    throw new ProviderNotConfiguredError(`ai vendor "${selection.vendor}" requires an api key.`);
  }
  return adapter.create(selection, apiKey);
}

export interface AiProviderResolution {
  selection: AiProviderSelection;
  apiKey?: string;
}

/**
 * resolves the provider for a request. priority:
 *   1. an explicit provider on the request (byok client selection) — the apiKey rides on
 *      the wire for the pre-accounts phase (used for this request only, never stored)
 *   2. server env config (SC_AI_VENDOR + SC_AI_MODEL + SC_AI_API_KEY) — the product-owned key
 *   3. the mock provider, so the app is always runnable and always free by default
 */
export function resolveAiProvider(
  requested?: AiProviderSelection,
  env: NodeJS.ProcessEnv = process.env,
  clientApiKey?: string,
): AiProviderResolution {
  if (requested !== undefined) {
    return { selection: requested, apiKey: requested.vendor === 'mock' ? undefined : clientApiKey };
  }
  const vendor = env.SC_AI_VENDOR;
  if (vendor !== undefined && vendor !== '' && vendor !== 'mock') {
    if (env.SC_AI_API_KEY === undefined || env.SC_AI_API_KEY === '') {
      throw new ProviderNotConfiguredError(
        `SC_AI_VENDOR is "${vendor}" but SC_AI_API_KEY is missing — set the key or unset SC_AI_VENDOR to use the mock provider.`,
      );
    }
    return {
      selection: { vendor: vendor as AiVendor, model: env.SC_AI_MODEL ?? 'default' },
      apiKey: env.SC_AI_API_KEY,
    };
  }
  return { selection: { vendor: 'mock', model: 'mock-inmemory' } };
}

/** validates that a resolved selection can actually serve requests — fails loudly on gaps. */
export function assertProviderServes(selection: AiProviderSelection): void {
  if (selection.vendor !== 'mock' && getVendorAdapter(selection.vendor) === undefined) {
    throw new ProviderNotConfiguredError(
      `ai vendor "${selection.vendor}" is not configured — add an adapter for it in provider-adapters.`,
    );
  }
}
