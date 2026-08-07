/**
 * shared domain types (data-model-shaped, mirroring the supabase tables in requirements.md §8).
 * these are structural — runtime validation lives in @screen-companion/validation.
 */

export type TitleType = 'movie' | 'tv';

export interface TitleSummary {
  id: string;
  externalId: string;
  name: string;
  type: TitleType;
  year: number | null;
  posterUrl: string | null;
  overview: string | null;
}

export interface EpisodeSummary {
  id: string;
  externalId: string;
  titleId: string;
  season: number;
  number: number;
  name: string;
  synopsis: string | null;
}

export interface PersonSummary {
  id: string;
  externalId: string;
  name: string;
  photoUrl: string | null;
}

export interface CharacterSummary {
  id: string;
  titleId: string;
  personId: string | null;
  name: string;
  description: string | null;
}

export interface WatchlistItem {
  id: string;
  titleId: string;
  titleName: string;
  titleType: TitleType;
  addedAt: string;
}

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
}

export type TvSessionStatus = 'pending' | 'connected' | 'expired' | 'disconnected';
