import {
  aiResponseSchema,
  cannedFallbackResponse,
  type AiResponse,
  type RequestContext,
} from '@screen-companion/ai-contracts';
import { filterByBoundary, type RetrievalChunk } from '@screen-companion/shared-utils';
import type { AiProvider, MetadataProvider } from './interfaces';

/**
 * retrieves the boundary-safe corpus: candidate chunks → spoiler filter (§7.2).
 * shared by the one-shot and streaming paths — the filter is the single narrowing control.
 */
export async function retrieveBoundarySafeChunks(
  metadata: MetadataProvider,
  context: RequestContext,
): Promise<RetrievalChunk[]> {
  const chunks = await metadata.getChunks(context.title.id, context.episode);
  return filterByBoundary(chunks, context.spoilerBoundary);
}

/**
 * companion orchestration — the one place the spoiler flow is wired together (§7.2, §7.4):
 *   1. retrieve candidate chunks
 *   2. filter by the spoiler boundary BEFORE the provider sees anything
 *   3. ask the provider with the boundary-safe corpus only
 *   4. validate the response against the contract; fall back to a canned safe answer on failure
 */
export async function askCompanion(
  metadata: MetadataProvider,
  ai: AiProvider,
  context: RequestContext,
): Promise<AiResponse> {
  const boundarySafe = await retrieveBoundarySafeChunks(metadata, context);

  const raw = await ai.ask({ context, chunks: boundarySafe });

  const parsed = aiResponseSchema.safeParse(raw);
  if (!parsed.success) return cannedFallbackResponse;
  return parsed.data;
}
