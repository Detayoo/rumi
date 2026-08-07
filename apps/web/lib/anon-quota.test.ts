import { describe, expect, it } from 'vitest';
import {
  ANON_QUOTA_MAX,
  isQuotaExhausted,
  nextQuota,
  quotaPolicyFor,
  signQuota,
  utcDayKey,
  verifyQuota,
} from './anon-quota';

const env = { SC_SESSION_SECRET: 'test-secret' } as unknown as NodeJS.ProcessEnv;
const day = '2026-08-07';

describe('anon quota — signed cookie', () => {
  it('round-trips a signed quota', () => {
    const cookie = signQuota({ questions: 3, day }, env);
    expect(verifyQuota(cookie, env)).toEqual({ questions: 3, day });
  });

  it('rejects a forged cookie', () => {
    const cookie = signQuota({ questions: 3, day }, env);
    const [body] = cookie.split('.');
    // same payload, signature computed without the secret
    expect(verifyQuota(`${body}.Zm9yZ2Vk`, env)).toBeNull();
  });

  it('rejects tampered payload', () => {
    const cookie = signQuota({ questions: 3, day }, env);
    const forged = signQuota({ questions: 0, day }, { SC_SESSION_SECRET: 'other-secret' } as unknown as NodeJS.ProcessEnv);
    expect(verifyQuota(forged, env)).toBeNull();
    expect(verifyQuota(cookie, env)).not.toBeNull();
  });

  it('rejects malformed cookies', () => {
    expect(verifyQuota('', env)).toBeNull();
    expect(verifyQuota('no-dot', env)).toBeNull();
    expect(verifyQuota('a.b.c', env)).toBeNull();
    expect(verifyQuota('YWJj.abc', env)).toBeNull();
  });

  it('rejects valid signature over a non-quota payload', () => {
    const body = Buffer.from(JSON.stringify({ hacked: true })).toString('base64url');
    const cookie = `${body}.${signQuota({ questions: 1, day }, env).split('.')[1]}`;
    expect(verifyQuota(cookie, env)).toBeNull();
  });
});

describe('anon quota — day rollover and exhaustion', () => {
  it('resets the counter on a new day', () => {
    expect(nextQuota({ questions: 5, day: '2026-08-06' }, '2026-08-07')).toEqual({
      questions: 1,
      day: '2026-08-07',
    });
    expect(nextQuota(null, day)).toEqual({ questions: 1, day });
  });

  it('increments within the same day', () => {
    expect(nextQuota({ questions: 2, day }, day)).toEqual({ questions: 3, day });
  });

  it('exhausts exactly at the limit and beyond', () => {
    expect(isQuotaExhausted({ questions: ANON_QUOTA_MAX - 1, day }, day)).toBe(false);
    expect(isQuotaExhausted({ questions: ANON_QUOTA_MAX, day }, day)).toBe(true);
    expect(isQuotaExhausted({ questions: 9, day }, day)).toBe(true);
    expect(isQuotaExhausted({ questions: 5, day: '2026-08-06' }, day)).toBe(false);
    expect(isQuotaExhausted(null, day)).toBe(false);
  });

  it('day key is a stable UTC date', () => {
    expect(utcDayKey(new Date('2026-08-07T23:59:59Z'))).toBe('2026-08-07');
    expect(utcDayKey(new Date('2026-08-08T00:00:00Z'))).toBe('2026-08-08');
  });
});

describe('quotaPolicyFor — byok bypasses the anonymous allowance', () => {
  it('a real vendor with the user\u2019s own key is byok (user pays — no cap)', () => {
    expect(quotaPolicyFor({ vendor: 'deepseek' }, 'sk-user')).toBe('byok');
    expect(quotaPolicyFor({ vendor: 'openai' }, 'sk-user')).toBe('byok');
  });

  it('the mock/demo engine is anon even with a key attached', () => {
    expect(quotaPolicyFor({ vendor: 'mock' }, 'sk-whatever')).toBe('anon');
    expect(quotaPolicyFor(undefined, undefined)).toBe('anon');
  });

  it('a real vendor without the user\u2019s key is anon (product would pay)', () => {
    expect(quotaPolicyFor({ vendor: 'openai' }, undefined)).toBe('anon');
    expect(quotaPolicyFor({ vendor: 'anthropic' }, '')).toBe('anon');
  });
});
