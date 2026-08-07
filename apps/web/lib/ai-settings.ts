import type { AiProviderSelection, AiVendor } from '@screen-companion/ai-contracts';

/**
 * byok settings — pre-accounts phase (adr-0002). the user's vendor/model/key live in this
 * browser until accounts land; then keys migrate to encrypted server-side storage and this
 * module shrinks to a thin read. the key is sent per-request for that request only.
 */

export interface AiSettings extends AiProviderSelection {
  apiKey: string;
}

const PROVIDER_KEY = 'sc_ai_provider';
const API_KEY_KEY = 'sc_ai_api_key';

export function loadAiSettings(): AiSettings | null {
  try {
    const rawProvider = localStorage.getItem(PROVIDER_KEY);
    const apiKey = localStorage.getItem(API_KEY_KEY);
    if (rawProvider === null || apiKey === null || apiKey === '') return null;
    const parsed = JSON.parse(rawProvider) as Partial<AiProviderSelection>;
    if (parsed.vendor === undefined || parsed.model === undefined) return null;
    return { vendor: parsed.vendor as AiVendor, model: parsed.model, apiKey };
  } catch {
    return null;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(PROVIDER_KEY, JSON.stringify({ vendor: settings.vendor, model: settings.model }));
    localStorage.setItem(API_KEY_KEY, settings.apiKey);
  } catch {
    // private mode — settings simply won't persist
  }
}

export function clearAiSettings(): void {
  try {
    localStorage.removeItem(PROVIDER_KEY);
    localStorage.removeItem(API_KEY_KEY);
  } catch {
    // noop
  }
}
