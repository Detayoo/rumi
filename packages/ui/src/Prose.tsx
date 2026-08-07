import { useMemo, type ReactNode } from 'react';
import type { TextSize } from '@screen-companion/design-tokens';

/**
 * Prose — the ONLY component allowed to render ai-generated or provider-supplied text
 * (design-system.md §6.6, req §13: no raw model output injected into the dom).
 * it sanitizes before rendering, then renders through the typography system.
 * never use Box/Text with dangerouslySetInnerHTML directly in feature code.
 */

const DANGEROUS_TAG_PATTERN = /<\s*(script|style|iframe|object|embed|form|input|button|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|style|iframe|object|embed|form|input|button|meta|link)\b[^>]*\/?>/gi;
const DANGEROUS_ATTR_PATTERN = /\s(on\w+|style|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_PATTERN = /href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi;

export function sanitizeRichText(input: string): string {
  return input
    .replace(DANGEROUS_TAG_PATTERN, '')
    .replace(DANGEROUS_ATTR_PATTERN, '')
    .replace(JAVASCRIPT_URL_PATTERN, '');
}

export interface ProseProps {
  content: string;
  size?: TextSize;
  className?: string;
}

export function Prose(props: ProseProps): ReactNode {
  const { content, size = 'body-lg', className } = props;

  const safe = useMemo(() => sanitizeRichText(content), [content]);

  return (
    <div
      className={`sc-prose ${className ?? ''}`.trim()}
      dangerouslySetInnerHTML={{
        __html: safe
          .split(/\n{2,}/)
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join(''),
      }}
      style={{
        fontSize: `var(--text-${size})`,
        lineHeight: `var(--leading-${size})`,
        color: 'var(--content-primary)',
      }}
    />
  );
}
