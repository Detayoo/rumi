import type { ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Stack } from './Stack';
import { Prose } from './Prose';
import { SpoilerBadge } from './SpoilerBadge';
import { Chip } from './Chip';
import type { SpoilerMode } from '@screen-companion/ai-contracts';
import type { BackgroundToken } from '@screen-companion/design-tokens';

/**
 * ChatBubble — composes Box (bubble shape, role-based fill) + Prose (message content,
 * sanitized) + SpoilerBadge when the answer contains spoilers + follow-up chips (§6.7).
 */
export interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  /** only meaningful on assistant messages — surfaces when an answer used spoiler content */
  spoilerMode?: SpoilerMode;
  followUpQuestions?: string[];
  onFollowUpPress?: (question: string) => void;
}

const ROLE_FILL: Record<'user' | 'assistant', BackgroundToken> = {
  user: 'action.primary.default',
  assistant: 'surface.raised',
};

const ROLE_TEXT: Record<'user' | 'assistant', 'content.inverse' | 'content.primary'> = {
  user: 'content.inverse',
  assistant: 'content.primary',
};

export function ChatBubble(props: ChatBubbleProps): ReactNode {
  const { role, content, spoilerMode, followUpQuestions = [], onFollowUpPress } = props;

  return (
    <Stack gap="s" width="100%" align={role === 'user' ? 'end' : 'start'}>
      <Box
        radius="m"
        padding="m"
        background={ROLE_FILL[role]}
        maxWidth="80%"
        border={role === 'assistant' ? 'border.subtle' : undefined}
        borderWidth={role === 'assistant' ? 'thin' : undefined}
      >
        {role === 'assistant' && spoilerMode !== undefined && (
          <Box paddingBottom="xs">
            <SpoilerBadge mode={spoilerMode} />
          </Box>
        )}
        {role === 'assistant' ? (
          <Prose content={content} />
        ) : (
          <Text size="body-lg" color={ROLE_TEXT[role]}>
            {content}
          </Text>
        )}
      </Box>
      {role === 'assistant' && followUpQuestions.length > 0 && (
        <Box display="flex" direction="row" wrap gap="xs">
          {followUpQuestions.map((question) => (
            <Chip key={question} onPress={onFollowUpPress ? () => onFollowUpPress(question) : undefined}>
              {question}
            </Chip>
          ))}
        </Box>
      )}
    </Stack>
  );
}
