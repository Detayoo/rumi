import type { SpoilerMode } from '@screen-companion/ai-contracts';

/**
 * conversation persistence — phase 2 local storage stand-in for the conversations/messages
 * tables (requirements.md §8). saved per (title, season, episode) so the transcript — and
 * the spoiler boundary that produced it — survives reloads. supabase replaces this in the
 * accounts phase; the shape below mirrors the future rows.
 */

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  /** present on assistant messages — the boundary actually used to answer */
  spoilerMode?: SpoilerMode;
  followUpQuestions?: string[];
}

export interface ConversationState {
  boundary: SpoilerMode;
  messages: ConversationMessage[];
}

export function conversationKey(titleId: string, season?: number, episode?: number): string {
  return `sc-conv-${titleId}-${season ?? 'movie'}-${episode ?? '-'}`;
}

export function loadConversation(key: string): ConversationState | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    if (!Array.isArray(parsed.messages) || !['none', 'episode-only', 'season-only', 'full-series'].includes(parsed.boundary ?? '')) {
      return null;
    }
    return { boundary: parsed.boundary as SpoilerMode, messages: parsed.messages };
  } catch {
    return null;
  }
}

export function saveConversation(key: string, state: ConversationState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // private mode / quota — the conversation simply won't persist
  }
}
