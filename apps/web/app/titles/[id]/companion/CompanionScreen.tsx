'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Card, ChatBubble, Chip, SpoilerBadge, Stack, Text, TextInput, useReducedMotion } from '@screen-companion/ui';
import { conversationKey, loadConversation, saveConversation, type ConversationMessage } from '@/lib/conversation';
import { loadAiSettings } from '@/lib/ai-settings';
import { parseSseStream } from '@/lib/sse';
import type { SpoilerMode, AiResponse } from '@screen-companion/ai-contracts';
import type { EpisodeSummary, TitleSummary } from '@screen-companion/types';

/**
 * the companion conversation — requirements.md §7.
 * - the active spoiler boundary is always visible (§7.3), and changing it mid-conversation
 *   appends a system message so the transcript explains why an answer's scope shifted
 * - retrieval-time filtering happens server-side (§7.2) — this screen only renders
 *   validated responses through ChatBubble (sanitized via Prose, §13)
 * - the ask is an sse stream: the model's reasoning streams into a live, collapsible
 *   thinking panel; the answer renders once the server validates the contract
 * - a 12s client guard shows the §7.6 degraded card with retry
 * - the transcript + boundary persist per (title, episode) in local storage until supabase
 *   conversations land (phase 4)
 */

const TIMEOUT_MS = 12_000;

const BOUNDARY_LABEL: Record<SpoilerMode, string> = {
  none: 'general only',
  'episode-only': 'episode-only',
  'season-only': 'season-only',
  'full-series': 'full-series',
};

interface ThinkingState {
  text: string;
  startedAt: number;
}

interface CompanionScreenProps {
  title: TitleSummary;
  episode?: EpisodeSummary;
}

/** collapsible reasoning note shown under an answer that thought first. */
function ThinkingNote({ text, seconds }: { text: string; seconds: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box background="surface.sunken" radius="s" paddingX="m" paddingY="s" maxWidth="80%">
      <Stack gap="xs">
        <Box
          as="button"
          focusable
          onPress={() => setExpanded(!expanded)}
          display="inline-flex"
          align="center"
          gap="xs"
          aria-expanded={expanded}
        >
          <Text size="caption" color="content.tertiary">
            {expanded ? 'hide reasoning' : `thought for ${seconds}s`}
          </Text>
        </Box>
        {expanded && (
          <Text size="caption" color="content.secondary" style={{ whiteSpace: 'pre-wrap' }}>
            {text}
          </Text>
        )}
      </Stack>
    </Box>
  );
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
  const [thinking, setThinking] = useState<ThinkingState | null>(null);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [showThinkingLive, setShowThinkingLive] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState<{ title: string; detail: string; retryable: boolean } | null>(null);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const lastQuestion = useRef<string>('');
  const thinkingRef = useRef<ThinkingState | null>(null);
  const thinkingBoxRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // follow the reasoning stream: keep the box scrolled to the newest text — but only while
  // the reader is already near the bottom, so scrolling up to re-read isn't interrupted.
  useEffect(() => {
    const box = thinkingBoxRef.current;
    if (box === null) return;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
    if (nearBottom) box.scrollTop = box.scrollHeight;
  }, [thinking?.text]);

  // live elapsed-seconds ticker so the pending state visibly moves even for models
  // that never emit reasoning (v4 flash, gpt-4o-mini, …)
  useEffect(() => {
    if (thinking === null) return;
    setThinkingSeconds(0);
    const tick = setInterval(() => setThinkingSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [thinking !== null]);

  useEffect(() => {
    const settings = loadAiSettings();
    setProviderLabel(settings !== null ? `${settings.vendor} · ${settings.model}` : null);
  }, []);

  useEffect(() => {
    saveConversation(storageKey, { boundary, messages });
  }, [boundary, messages, storageKey]);

  useEffect(() => {
    const target = formRef.current;
    if (target === null) return;
    const scroll = () => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
    scroll();
    const settle = setTimeout(scroll, 150);
    return () => clearTimeout(settle);
  }, [messages, thinking, reduce]);

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
      if (trimmed === '' || thinkingRef.current !== null) return;

      lastQuestion.current = trimmed;
      setQuestion('');
      setError(null);
      setDegraded(false);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);

      const startedAt = Date.now();
      thinkingRef.current = { text: '', startedAt };
      setThinking(thinkingRef.current);

      const timeoutTimer = setTimeout(() => {
        setDegraded(true);
        setThinking(null);
      }, TIMEOUT_MS);

      const settings = loadAiSettings();
      try {
        const response = await fetch('/api/v1/companion/ask', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'text/event-stream',
          },
          body: JSON.stringify({
            ...buildContext(trimmed),
            provider: settings !== null ? { vendor: settings.vendor, model: settings.model } : undefined,
            apiKey: settings?.apiKey,
          }),
        });

        if (!response.ok || response.body === null) {
          const envelope = (await response.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
          throw Object.assign(new Error(envelope?.error?.message ?? 'the request failed.'), {
            code: envelope?.error?.code ?? 'unknown_error',
            status: response.status,
          });
        }

        let answer: AiResponse | null = null;
        for await (const event of parseSseStream(response.body)) {
          if (event.event === 'thinking') {
            const delta = (event.data as { delta?: string }).delta ?? '';
            if (delta !== '') {
              if (thinkingRef.current !== null) {
                thinkingRef.current = { ...thinkingRef.current, text: thinkingRef.current.text + delta };
              }
              setThinking((t) => (t !== null ? { ...t, text: t.text + delta } : t));
            }
          } else if (event.event === 'done') {
            answer = (event.data as { response: AiResponse }).response;
            break;
          } else if (event.event === 'error') {
            const payload = event.data as { code: string; message: string };
            throw Object.assign(new Error(payload.message), { code: payload.code, status: 500 });
          }
        }

        if (answer === null) throw new Error('the stream ended without an answer.');
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: answer.answer,
            spoilerMode: answer.spoilerLevelUsed,
            followUpQuestions: answer.followUpQuestions,
            thinking: (thinkingRef.current?.text.trim() ?? '') || undefined,
            thinkingSeconds: elapsed,
          },
        ]);
        thinkingRef.current = null;
        setThinking(null);
      } catch (cause) {
        const err = cause as Error & { code?: string; status?: number };
        if (err.code === 'rate_limited') {
          setError({ title: 'Daily question limit reached', detail: err.message, retryable: false });
        } else {
          setError({
            title: err.code === 'timeout' ? 'Taking longer than usual' : 'Couldn’t get an answer',
            detail:
              err.code === 'provider_error'
                ? `${err.message} If you’re using your own key, double-check it in provider settings.`
                : err.message,
            retryable: err.status === 504 || err.status === 500 || err.status === 0,
          });
        }
        thinkingRef.current = null;
        setThinking(null);
      } finally {
        clearTimeout(timeoutTimer);
      }
    },
    [buildContext],
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
          {messages.length === 0 && thinking === null && (
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
              <Stack key={message.id} gap="xs" align={message.role === 'user' ? 'end' : 'start'} width="100%">
                <ChatBubble
                  role={message.role === 'user' ? 'user' : 'assistant'}
                  content={message.content}
                  spoilerMode={message.spoilerMode}
                  followUpQuestions={message.followUpQuestions}
                  onFollowUpPress={(q) => void ask(q)}
                />
                {message.thinking !== undefined && (
                  <ThinkingNote text={message.thinking} seconds={message.thinkingSeconds ?? 0} />
                )}
              </Stack>
            ),
          )}

          {thinking !== null && (
            <Card padding="m" border="border.subtle">
              <Stack gap="s">
                <Box display="flex" direction="row" align="center" gap="s">
                  <span className="sc-spinner" style={{ fontSize: 'var(--text-caption)' }} aria-hidden="true" />
                  <Text size="caption" color="content.secondary">
                    thinking…
                  </Text>
                  <Text size="caption" color="content.tertiary">
                    {thinkingSeconds}s
                  </Text>
                  {thinking.text !== '' && (
                    <Box
                      as="button"
                      focusable
                      onPress={() => setShowThinkingLive(!showThinkingLive)}
                      aria-expanded={showThinkingLive}
                    >
                      <Text size="caption" color="content.tertiary">
                        {showThinkingLive ? 'hide reasoning' : 'show reasoning'}
                      </Text>
                    </Box>
                  )}
                </Box>
                {showThinkingLive && thinking.text !== '' && (
                  <Box
                    ref={thinkingBoxRef}
                    background="surface.base"
                    radius="s"
                    padding="s"
                    maxHeight={200}
                    style={{ overflowY: 'auto' }}
                  >
                    <Text size="caption" color="content.secondary" style={{ whiteSpace: 'pre-wrap' }}>
                      {thinking.text}
                    </Text>
                  </Box>
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
              disabled={thinking !== null}
            />
          </Box>
          <Button type="submit" disabled={thinking !== null || question.trim() === ''}>
            {thinking !== null ? 'Thinking' : 'Ask'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
