import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { askRequestSchema, type AiResponse } from '@screen-companion/ai-contracts';
import {
  askCompanion,
  createAiProvider,
  MockMetadataProvider,
  ProviderNotConfiguredError,
  resolveAiProvider,
  type AiProvider,
} from '@screen-companion/provider-adapters';
import {
  ANON_QUOTA_MAX,
  isQuotaExhausted,
  nextQuota,
  quotaPolicyFor,
  signQuota,
  utcDayKey,
  verifyQuota,
} from '@/lib/anon-quota';

/**
 * POST /api/v1/companion/ask — requirements.md §7, §9, adr-0002.
 * 1. zod-validate the ask request (context + optional byok provider selection) (§9.4)
 * 2. anonymous quota: signed httponly cookie, 5/day, reset after 24h (§5)
 * 3. resolve the ai provider: request selection → env config → mock (never a silent mock
 *    when the user asked for a real vendor — that fails loudly as a typed envelope)
 * 4. retrieve + boundary-filter + ask through provider-adapters
 * 5. 12s server-side timeout → typed timeout response, never a hang (§7.6)
 * 6. consistent error envelope on every failure (§9.2), requestId on every log line (§3.4)
 *
 * auth + per-user stored keys arrive with supabase (phase 4) — until then every session is
 * anonymous and the provider comes from env or defaults to mock.
 */

export const dynamic = 'force-dynamic';

const metadata = new MockMetadataProvider();

const AI_TIMEOUT_MS = 12_000;
const QUOTA_COOKIE = 'sc_anon_quota';

interface Envelope<T> {
  data?: T;
  error?: { code: string; message: string; requestId?: string };
}

function errorEnvelope(status: number, code: string, message: string, requestId: string): NextResponse<Envelope<never>> {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function POST(request: Request): Promise<NextResponse<Envelope<AiResponse>>> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const day = utcDayKey();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorEnvelope(400, 'invalid_request', 'request body must be valid json.', requestId);
  }

  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorEnvelope(400, 'invalid_request', 'request context failed validation.', requestId);
  }
  const { provider: requestedProvider, apiKey: clientApiKey, ...context } = parsed.data;

  const store = await cookies();
  const policy = quotaPolicyFor(requestedProvider, clientApiKey);

  // byok requests are charged to the user's own key — the anonymous demo allowance does not apply
  const currentQuota = policy === 'byok' ? null : verifyQuota(store.get(QUOTA_COOKIE)?.value);
  if (policy === 'anon' && isQuotaExhausted(currentQuota, day)) {
    console.log(JSON.stringify({ event: 'ai_request', requestId, outcome: 'rate_limited', quotaPolicy: policy, spoilerMode: context.spoilerBoundary.mode }));
    return errorEnvelope(
      429,
      'rate_limited',
      `you've reached today's question limit (${ANON_QUOTA_MAX} anonymous questions per day). add your own api key in provider settings to keep asking — your key is charged to your own account.`,
      requestId,
    );
  }

  let ai: AiProvider;
  try {
    const resolution = resolveAiProvider(requestedProvider, process.env, clientApiKey);
    ai = createAiProvider(resolution.selection, resolution.apiKey);
  } catch (cause) {
    const message = cause instanceof ProviderNotConfiguredError ? cause.message : 'ai provider configuration error.';
    console.log(JSON.stringify({ event: 'ai_request', requestId, outcome: 'provider_config_error', error: message }));
    return errorEnvelope(500, 'provider_error', 'the ai provider you asked for is not configured — check the provider settings.', requestId);
  }

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('ai_timeout')), AI_TIMEOUT_MS);
  });

  try {
    const response = await Promise.race([
      askCompanion(metadata, ai, context),
      timeout,
    ]);

    const updated = policy === 'byok' ? null : nextQuota(currentQuota, day);
    const res = NextResponse.json({ data: response });
    if (updated !== null) {
      res.cookies.set(QUOTA_COOKIE, signQuota(updated), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
    }

    console.log(
      JSON.stringify({
        event: 'ai_request',
        requestId,
        outcome: 'ok',
        latencyMs: Date.now() - startedAt,
        model: ai.name,
        quotaPolicy: policy,
        spoilerMode: context.spoilerBoundary.mode,
        questionsUsed: updated?.questions,
      }),
    );
    return res;
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.message === 'ai_timeout';
    console.log(
      JSON.stringify({
        event: 'ai_request',
        requestId,
        outcome: timedOut ? 'timeout' : 'error',
        latencyMs: Date.now() - startedAt,
        error: timedOut ? 'ai_timeout' : cause instanceof Error ? cause.message : 'unknown',
        spoilerMode: context.spoilerBoundary.mode,
      }),
    );
    if (timedOut) {
      return errorEnvelope(504, 'timeout', 'this is taking longer than usual — please try again.', requestId);
    }
    return errorEnvelope(500, 'provider_error', 'the answer service is unavailable right now — please try again shortly.', requestId);
  }
}
