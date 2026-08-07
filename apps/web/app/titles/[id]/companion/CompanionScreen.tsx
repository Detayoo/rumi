'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClient, ApiError, askQuestion } from '@screen-companion/api-client';
import { Box, Button, Card, ChatBubble, Chip, SpoilerBadge, Stack, Text, TextInput, useReducedMotion } from '@screen-companion/ui';
import { conversationKey, loadConversation, saveConversation, type ConversationMessage } from '@/lib/conversation';
import { loadAiSettings } from '@/lib/ai-settings';
import type { SpoilerMode } from '@screen-companion/ai-contracts';
import type { EpisodeSummary, TitleSummary } from '@screen-companion/types';

/**
 * the companion conversation — requirements.md §7.
 * - the active spoiler boundary is always visible (§7.3), and changing it mid-conversation
 *   appends a system message so the transcript explains why an answer's scope shifted
 * - retrieval-time filtering happens server-side (§7.2) — this screen only renders
 *   validated responses through ChatBubble (sanitized via Prose, §13)
 * - loading state appears past 400ms; a 12s timeout shows the §7.6 degraded card with retry
 * - the transcript + boundary persist per (title, episode) in local storage until supabase
 *   conversations land (phase 4)
 */

const client = new ApiClient('');

const SLOW_THRESHOLD_MS = 400;
const TIMEOUT_MS = 12_000;

const BOUNDARY_LABEL: Record<SpoilerMode, string> = {
  none: 'general only',
  'episode-only': 'episode-only',
  'season-only': 'season-only',
  'full-series': 'full-series',
};

interface CompanionScreenProps {
  title: TitleSummary;
  episode?: EpisodeSummary;
}

export function CompanionScreen({ title, episode }: CompanionScreenProps) {
  const isTv = title.type === 'tv';
  const boundaryOptions: SpoilerMode[] = isTv
    ? ['none', 'episode-only', 'season-only', 'full-series']
    : ['none', 'full-series'];

  const storageKey = conversationKey(title.id, episode?.season, episode?.number);

  const [boundary, setBoundary] = useState<SpoilerMode>(() => {
    if (typeof window === 'undefined') return isTv ? 'episode-only' : 'none';
    return loadConversation(storageKey)?.boundary ?? (isTv ? 'episode-only' : 'none');
  });
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadConversation(storageKey)?.messages ?? [];
  });
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState<{ title: string; detail: string; retryable: boolean } | null>(null);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const lastQuestion = useRef<string>('');
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const settings = loadAiSettings();
    setProviderLabel(settings !== null ? `${settings.vendor} · ${settings.model}` : null);
  }, []);

  useEffect(() => {
    saveConversation(storageKey, { boundary, messages });
  }, [boundary, messages, storageKey]);

  useEffect(() => {
    // scroll the ask-form into view (block: 'end' → input sits at the bottom edge with the
    // newest message right above it — the classic chat position). fires after paint, then
    // again once layout settles (entrances/fonts can shift page height mid-scroll).
    const target = formRef.current;
    if (target === null) return;
    const scroll = () => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
    scroll();
    const settle = setTimeout(scroll, 150);
    return () => clearTimeout(settle);
  }, [messages, pending, reduce]);

  const changeBoundary = (next: SpoilerMode) => {
    if (next === boundary) return;
    setBoundary(next);
    if (messages.length > 0) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Spoiler level changed to ${BOUNDARY_LABEL[next]}.`,
        },
      ]);
    }
  };

  const buildContext = useCallback(
    (questionText: string) => ({
      title: { id: title.id, name: title.name, type: title.type },
      episode: episode
        ? { season: episode.season, number: episode.number, name: episode.name }
        : undefined,
      spoilerBoundary:
        boundary === 'episode-only' && episode
          ? { mode: boundary, maximumSeason: episode.season, maximumEpisode: episode.number }
          : boundary === 'season-only' && episode
            ? { mode: boundary, maximumSeason: episode.season }
            : { mode: boundary },
      language: 'en',
      question: questionText,
    }),
    [boundary, episode, title],
  );

  const ask = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (trimmed === '' || pending) return;

      lastQuestion.current = trimmed;
      setQuestion('');
      setError(null);
      setSlow(false);
      setDegraded(false);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
      setPending(true);

      const slowTimer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
      const timeoutTimer = setTimeout(() => {
        setDegraded(true);
        setPending(false);
      }, TIMEOUT_MS);

      try {
        const settings = loadAiSettings();
        const response = await askQuestion(
          client,
          buildContext(trimmed),
          settings !== null ? { vendor: settings.vendor, model: settings.model } : undefined,
          settings?.apiKey,
        );
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.answer,
            spoilerMode: response.spoilerLevelUsed,
            followUpQuestions: response.followUpQuestions,
          },
        ]);
      } catch (cause) {
        if (cause instanceof ApiError) {
          if (cause.code === 'rate_limited') {
            setError({
              title: 'Daily question limit reached',
              detail: cause.message,
              retryable: false,
            });
          } else {
            setError({
              title: cause.code === 'timeout' ? 'Taking longer than usual' : 'Couldn’t get an answer',
              detail:
                cause.code === 'provider_error'
                  ? `${cause.message} If you’re using your own key, double-check it in provider settings.`
                  : cause.message,
              retryable: cause.status === 504 || cause.status === 500 || cause.status === 0,
            });
          }
        } else {
          setError({ title: 'Something went wrong', detail: 'Please try again in a moment.', retryable: true });
        }
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        setPending(false);
        setSlow(false);
        setDegraded(false);
      }
    },
    [buildContext, pending],
  );

  const episodeLabel = episode ? `S${episode.season}E${episode.number} — ${episode.name}` : title.name;

  return (
    <Box display="flex" justify="center" paddingX="m" paddingY="xl">
      <Stack gap="l" maxWidth={640} width="100%">
          <Stack gap="2xs">
            <Link href={`/titles/${title.id}`}>
              <Text size="body-sm" color="content.link">
                ← back to {title.name}
              </Text>
            </Link>
            <Text as="h1" size="title-lg" weight="bold">
              {title.name}
            </Text>
            <Text size="caption" color="content.tertiary">
              {episodeLabel}
            </Text>
            <Text size="caption" color="content.tertiary">
              {providerLabel !== null ? `answering with ${providerLabel} · your key` : 'answering with the built-in demo engine'}
              {' · '}
              <Link href="/settings">
                <Text as="span" size="caption" color="content.link">
                  provider settings
                </Text>
              </Link>
            </Text>
          </Stack>

        <Card padding="m">
          <Stack gap="s">
            <Box display="flex" direction="row" align="center" justify="between" wrap gap="s">
              <Text as="h2" size="title-sm" weight="semibold">
                Spoiler boundary
              </Text>
              <SpoilerBadge mode={boundary} />
            </Box>
            <Text size="body-sm" color="content.secondary">
              Answers stay within this boundary. You can change it mid-conversation — the
              transcript will note it.
            </Text>
            <Box display="flex" direction="row" wrap gap="xs" role="group" aria-label="spoiler boundary">
              {boundaryOptions.map((mode) => (
                <Chip
                  key={mode}
                  onPress={() => changeBoundary(mode)}
                  background={boundary === mode ? 'action.primary.default' : 'surface.sunken'}
                  color={boundary === mode ? 'content.inverse' : 'content.secondary'}
                >
                  {BOUNDARY_LABEL[mode]}
                </Chip>
              ))}
            </Box>
          </Stack>
        </Card>

        <Stack gap="s" role="log" aria-label="conversation">
          {messages.length === 0 && !pending && (
            <Card padding="l">
              <Stack gap="xs" align="center">
                <Text as="h2" size="title-sm" weight="semibold">
                  Ask anything about this episode
                </Text>
                <Text size="body-sm" color="content.secondary" align="center">
                  “Why is Mark behaving differently?” — answers are grounded in episode
                  metadata and stop exactly at your boundary.
                </Text>
              </Stack>
            </Card>
          )}

          {messages.map((message) =>
            message.role === 'system' ? (
              <Text key={message.id} size="caption" color="content.tertiary" align="center">
                {message.content}
              </Text>
            ) : (
              <ChatBubble
                key={message.id}
                role={message.role === 'user' ? 'user' : 'assistant'}
                content={message.content}
                spoilerMode={message.spoilerMode}
                followUpQuestions={message.followUpQuestions}
                onFollowUpPress={(q) => void ask(q)}
              />
            ),
          )}

          {pending && (
            <Card padding="l" border="border.subtle">
              <Stack gap="2xs">
                <Text size="body-md" color="content.secondary">
                  {slow ? 'Still thinking…' : 'Thinking'}
                </Text>
                {slow && (
                  <Text size="caption" color="content.tertiary">
                    Good answers take a moment — they’re checked against episode metadata.
                  </Text>
                )}
              </Stack>
            </Card>
          )}

          {degraded && (
            <Card padding="l" border="feedback.warning">
              <Stack gap="s">
                <Text as="h2" size="title-sm" weight="semibold" color="feedback.warning">
                  This is taking longer than usual
                </Text>
                <Text size="body-sm" color="content.secondary">
                  The answer service is slow right now. You can retry, or wait a moment.
                </Text>
                <Box display="flex" direction="row" gap="s">
                  <Button size="s" onPress={() => void ask(lastQuestion.current)}>
                    Retry
                  </Button>
                </Box>
              </Stack>
            </Card>
          )}

          {error !== null && (
            <Card padding="l" border="feedback.danger">
              <Stack gap="s">
                <Text as="h2" size="title-sm" weight="semibold" color="feedback.danger">
                  {error.title}
                </Text>
                <Text size="body-sm" color="content.secondary">
                  {error.detail}
                </Text>
                {error.retryable && (
                  <Box display="flex" direction="row" gap="s">
                    <Button size="s" variant="secondary" onPress={() => void ask(lastQuestion.current)}>
                      Try again
                    </Button>
                  </Box>
                )}
              </Stack>
            </Card>
          )}

          <div ref={endRef} />
        </Stack>

        <Box
          as="form"
          ref={formRef}
          onSubmit={(event) => { event.preventDefault(); void ask(question); }}
          display="flex"
          direction="row"
          gap="s"
          align="end"
        >
          <Box style={{ flex: 1 }}>
            <TextInput
              label="Ask the companion"
              value={question}
              onChange={setQuestion}
              placeholder={isTv ? `About S${episode?.season ?? '?'}E${episode?.number ?? '?'} — ${episode?.name ?? ''}`.trim() : 'Ask about this movie…'}
              disabled={pending}
            />
          </Box>
          <Button type="submit" disabled={pending || question.trim() === ''}>
            {pending ? 'Asking' : 'Ask'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
