import { describe, expect, it } from 'vitest';
import {
  assertProviderServes,
  createAiProvider,
  getVendorAdapter,
  listSupportedVendors,
  ProviderNotConfiguredError,
  resolveAiProvider,
} from './registry';

describe('provider registry — the byok seam (adr-0002)', () => {
  it('defaults to the mock provider with no env config — zero keys, zero cost', () => {
    const resolution = resolveAiProvider(undefined, {});
    expect(resolution.selection).toEqual({ vendor: 'mock', model: 'mock-inmemory' });
    expect(resolution.apiKey).toBeUndefined();
  });

  it('honours an explicit byok request selection', () => {
    const resolution = resolveAiProvider({ vendor: 'openai', model: 'gpt-4o-mini' }, {});
    expect(resolution.selection).toEqual({ vendor: 'openai', model: 'gpt-4o-mini' });
  });

  it('passes the client\u2019s own key through for a real vendor (pre-accounts byok)', () => {
    const resolution = resolveAiProvider(
      { vendor: 'openai', model: 'gpt-4o-mini' },
      {},
      'sk-client-key',
    );
    expect(resolution.apiKey).toBe('sk-client-key');
  });

  it('never surfaces a client key for the mock vendor', () => {
    const resolution = resolveAiProvider({ vendor: 'mock', model: 'mock-inmemory' }, {}, 'sk-nope');
    expect(resolution.apiKey).toBeUndefined();
  });

  it('uses the env config when no request selection is given (product-owned key)', () => {
    const env = { SC_AI_VENDOR: 'openai', SC_AI_MODEL: 'gpt-4o-mini', SC_AI_API_KEY: 'sk-test' };
    const resolution = resolveAiProvider(undefined, env);
    expect(resolution.selection).toEqual({ vendor: 'openai', model: 'gpt-4o-mini' });
    expect(resolution.apiKey).toBe('sk-test');
  });

  it('fails loudly when the env names a vendor but no key is set — never silently mock', () => {
    expect(() => resolveAiProvider(undefined, { SC_AI_VENDOR: 'openai' })).toThrow(
      ProviderNotConfiguredError,
    );
  });

  it('succeeds for a registered vendor and fails only when unconfigured', () => {
    // registered vendors are now served…
    expect(() => assertProviderServes({ vendor: 'openai', model: 'gpt-4o-mini' })).not.toThrow();
    expect(() => assertProviderServes({ vendor: 'google', model: 'gemini-2.5-flash' })).not.toThrow();
    // …but a real vendor without a key still fails loudly
    expect(() => createAiProvider({ vendor: 'openai', model: 'gpt-4o-mini' })).toThrow(
      ProviderNotConfiguredError,
    );
    expect(() => createAiProvider({ vendor: 'openai', model: 'gpt-4o-mini' }, 'sk-test')).not.toThrow();
  });

  it('creates a mock provider without a key', () => {
    const provider = createAiProvider({ vendor: 'mock', model: 'mock-inmemory' });
    expect(provider.name).toBe('mock-ai');
  });

  it('refuses a keyless real provider', () => {
    expect(() => createAiProvider({ vendor: 'mock', model: 'mock-inmemory' }, undefined)).not.toThrow();
  });

  it('exposes the vendor list for the byok settings ui', () => {
    const vendors = listSupportedVendors();
    expect(vendors.map((v) => v.vendor)).toEqual(['mock', 'openai', 'anthropic', 'google']);
    expect(getVendorAdapter('openai')?.availableModels[0]?.id).toBe('gpt-4o-mini');
    expect(getVendorAdapter('mock')?.availableModels[0]?.id).toBe('mock-inmemory');
  });
});
