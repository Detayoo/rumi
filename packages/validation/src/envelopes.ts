import { z } from 'zod';

/**
 * api-wide contracts — requirements.md §9.
 * every endpoint returns the error envelope (§9.2) on failure and the pagination
 * envelope (§9.1) on list endpoints, so client code needs no per-endpoint error handling.
 */

/** §9.2 consistent error envelope */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().uuid().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/** §9.1 cursor-based pagination envelope */
export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
  });
export type Paginated<T> = { data: T[]; nextCursor: string | null };

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type CursorQuery = z.infer<typeof cursorQuerySchema>;

export const idParamSchema = z.string().min(1);
