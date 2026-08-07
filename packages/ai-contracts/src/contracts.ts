import { z } from 'zod';

/**
 * ai request + response contracts, per requirements.md §7.
 * both sides of the boundary (client -> api, provider -> api, api -> client)
 * validate against these schemas — nothing raw ever reaches the ui (§7.4).
 */

export const spoilerModeSchema = z.enum([
  'none',
  'episode-only',
  'season-only',
  'full-series',
]);
export type SpoilerMode = z.infer<typeof spoilerModeSchema>;

export const spoilerBoundarySchema = z.object({
  mode: spoilerModeSchema,
  /** inclusive max season the user is willing to hear about */
  maximumSeason: z.number().int().positive().optional(),
  /** inclusive max episode (within maximumSeason) the user is willing to hear about */
  maximumEpisode: z.number().int().positive().optional(),
});
export type SpoilerBoundary = z.infer<typeof spoilerBoundarySchema>;

/** §7.1 request context */
export const requestContextSchema = z.object({
  title: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['movie', 'tv']),
  }),
  episode: z
    .object({
      season: z.number().int().positive(),
      number: z.number().int().positive(),
      name: z.string(),
    })
    .optional(),
  spoilerBoundary: spoilerBoundarySchema,
  language: z.string().default('en'),
  question: z.string().min(1).max(1000),
});
export type RequestContext = z.infer<typeof requestContextSchema>;

/**
 * byok (bring-your-own-key) provider selection — adr-0002.
 * a client can name the vendor + model it wants for this question; the server pairs that
 * with the user's stored api key (or, until the accounts phase, the server env config).
 */
export const aiVendorSchema = z.enum(['mock', 'openai', 'anthropic', 'google']);
export type AiVendor = z.infer<typeof aiVendorSchema>;

export const aiProviderSelectionSchema = z.object({
  vendor: aiVendorSchema,
  model: z.string().min(1),
});
export type AiProviderSelection = z.infer<typeof aiProviderSelectionSchema>;

/**
 * ask request body = context + optional provider selection.
 * apiKey is the pre-accounts byok seam (adr-0002): the client's own key for a real vendor,
 * used for this request only and never stored or logged. when accounts land, the server
 * resolves keys from the user's encrypted settings instead and this field is removed.
 */
export const askRequestSchema = requestContextSchema.extend({
  provider: aiProviderSelectionSchema.optional(),
  apiKey: z.string().min(1).optional(),
});
export type AskRequest = z.infer<typeof askRequestSchema>;

export const confidenceSchema = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof confidenceSchema>;

export const responseEntitySchema = z.object({
  type: z.enum(['character', 'episode', 'place', 'other']),
  id: z.string().optional(),
  name: z.string(),
});
export type ResponseEntity = z.infer<typeof responseEntitySchema>;

/** §7.4 ai response contract */
export const aiResponseSchema = z.object({
  answer: z.string().min(1),
  spoilerLevelUsed: spoilerModeSchema,
  containsSpoilers: z.boolean(),
  confidence: confidenceSchema,
  followUpQuestions: z.array(z.string()).max(4),
  entities: z.array(responseEntitySchema).default([]),
});
export type AiResponse = z.infer<typeof aiResponseSchema>;

/** the safe canned fallback for schema-validation failure (§7.4) */
export const cannedFallbackResponse: AiResponse = {
  answer:
    "I wasn't able to generate a reliable answer to that — try rephrasing, or ask something more specific about this episode.",
  spoilerLevelUsed: 'none',
  containsSpoilers: false,
  confidence: 'low',
  followUpQuestions: [],
  entities: [],
};

export function isSpoilerMode(value: unknown): value is SpoilerMode {
  return spoilerModeSchema.safeParse(value).success;
}
