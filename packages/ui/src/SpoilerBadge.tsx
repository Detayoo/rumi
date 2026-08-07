import type { ReactNode } from 'react';
import { Chip } from './Chip';
import type { SpoilerMode } from '@screen-companion/ai-contracts';
import type { SpoilerToken } from '@screen-companion/design-tokens';

/**
 * SpoilerBadge — a Chip with the spoiler level pre-wired (design-system.md §6.3).
 * requirement §7.3: the ui must ALWAYS display the active boundary; requirement §7 a11y:
 * color is never the only signal — the badge always pairs its tint with a text label.
 */
export interface SpoilerBadgeProps {
  mode: SpoilerMode;
}

const MODE_LABEL: Record<SpoilerMode, string> = {
  none: 'general only',
  'episode-only': 'episode-only',
  'season-only': 'season-only',
  'full-series': 'full-series',
};

const MODE_TINT: Record<SpoilerMode, SpoilerToken | 'surface.sunken'> = {
  none: 'surface.sunken',
  'episode-only': 'spoiler.safe',
  'season-only': 'spoiler.caution',
  'full-series': 'spoiler.full',
};

export function SpoilerBadge(props: SpoilerBadgeProps): ReactNode {
  const { mode } = props;
  return (
    <Chip background={MODE_TINT[mode]} color={mode === 'none' ? 'content.secondary' : 'content.primary'}>
      {MODE_LABEL[mode]}
    </Chip>
  );
}
