import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * anonymous demo quota — requirements.md §5.
 * 5 ai questions per anonymous session, tracked by a signed, httponly cookie (not ip alone,
 * which is unreliable behind cgnat), reset after 24 hours.
 *
 * the cookie value is `base64url(payload).base64url(hmac-sha256(payload))`; the payload is
 * `{ questions, day }` where day is a UTC date key. the hmac is the integrity control —
 * a client cannot forge or edit their quota without the server secret.
 * server-only: imports node:crypto.
 */

export interface AnonQuota {
  questions: number;
  day: string;
}

export const ANON_QUOTA_MAX = 5;

export function utcDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function secretFor(env: NodeJS.ProcessEnv): string {
  const secret = env.SC_SESSION_SECRET;
  if (secret !== undefined && secret !== '') return secret;
  // dev-only fallback — never use in production; the route flags it via env exposure checks
  return 'dev-insecure-session-secret';
}

export function signQuota(payload: AnonQuota, env: NodeJS.ProcessEnv = process.env): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secretFor(env)).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** returns the decoded quota, or null when the cookie is missing, malformed or forged. */
export function verifyQuota(cookie: string | undefined, env: NodeJS.ProcessEnv = process.env): AnonQuota | null {
  if (cookie === undefined || cookie === '') return null;
  const [body, sig] = cookie.split('.');
  if (body === undefined || sig === undefined) return null;

  const expected = createHmac('sha256', secretFor(env)).update(body).digest('base64url');
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(sig);
  if (expectedBuf.length !== givenBuf.length || !timingSafeEqual(expectedBuf, givenBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<AnonQuota>;
    if (typeof parsed.questions !== 'number' || typeof parsed.day !== 'string') return null;
    return { questions: parsed.questions, day: parsed.day };
  } catch {
    return null;
  }
}

/** newest quota for this session: fresh-day resets the counter, otherwise +1. */
export function nextQuota(current: AnonQuota | null, day: string = utcDayKey()): AnonQuota {
  if (current === null || current.day !== day) return { questions: 1, day };
  return { questions: current.questions + 1, day };
}

/** true when the session is over the daily limit for the given day. */
export function isQuotaExhausted(quota: AnonQuota | null, day: string = utcDayKey()): boolean {
  return quota !== null && quota.day === day && quota.questions >= ANON_QUOTA_MAX;
}
