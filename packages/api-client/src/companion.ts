import type { AiProviderSelection, AiResponse, RequestContext } from '@screen-companion/ai-contracts';
import type { ApiClient } from './client';

/**
 * companion endpoint methods — /api/v1/companion/ask (requirements.md §7, §9, adr-0002).
 * the ask route validates the context server-side, enforces the anonymous quota, resolves
 * the ai provider (request selection → env config → mock) and returns the §9.2 envelope;
 * this client only needs the path + types. the provider field is the byok seam — omit it
 * to use the server default.
 */

export interface AskResponseEnvelope {
  data: AiResponse;
}

export async function askQuestion(
  client: ApiClient,
  context: RequestContext,
  provider?: AiProviderSelection,
): Promise<AiResponse> {
  const envelope = await client.post<AskResponseEnvelope>('/api/v1/companion/ask', {
    ...context,
    provider,
  });
  return envelope.data;
}
