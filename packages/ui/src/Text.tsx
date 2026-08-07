import type { CSSProperties, ReactNode } from 'react';
import { toCssVar, type ContentToken, type FontWeight, type TextSize } from '@screen-companion/design-tokens';

/**
 * Text — Box's sibling, and the only place typography tokens are allowed (§3.4).
 * `size` picks the look, `as` picks the semantics: a card title can be
 * <Text as="h3" size="title-sm"> — visually small but a real heading.
 *
 * family follows size: display and title-lg render in the display family (PolySans Wide),
 * everything else in the body family (PolySans) — one type vocabulary, two cuts.
 */

export interface TextProps {
  size?: TextSize;
  weight?: FontWeight;
  /** content tokens plus feedback.danger for error text (semantic extension of the scale, per §1.2) */
  color?: ContentToken | 'feedback.danger';
  align?: 'start' | 'center' | 'end';
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'label' | 'div';
  truncate?: boolean;
  maxLines?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  htmlFor?: string;
}

const HEADING_MAP: Partial<Record<TextSize, 'h1' | 'h2' | 'h3' | 'h4'>> = {
  display: 'h1',
  'title-lg': 'h1',
  'title-md': 'h2',
  'title-sm': 'h3',
};

const DISPLAY_SIZES: ReadonlySet<TextSize> = new Set(['display', 'title-lg']);

export function Text(props: TextProps): ReactNode {
  const {
    size = 'body-md',
    weight = 'regular',
    color = 'content.primary',
    align = 'start',
    as,
    truncate = false,
    maxLines,
    children,
    className,
    style,
    ...rest
  } = props;

  const Tag = as ?? HEADING_MAP[size] ?? 'span';

  const styleMap: CSSProperties = {
    fontFamily: DISPLAY_SIZES.has(size) ? 'var(--font-family-display)' : 'var(--font-family-body)',
    fontSize: toCssVar(`text.${size}`),
    lineHeight: toCssVar(`leading.${size}`),
    fontWeight: toCssVar(`weight.${weight}`),
    color: toCssVar(color),
    textAlign: align,
    margin: 0,
  };

  if (truncate) {
    styleMap.overflow = 'hidden';
    styleMap.textOverflow = 'ellipsis';
    styleMap.whiteSpace = 'nowrap';
  }

  if (maxLines !== undefined && maxLines > 1) {
    styleMap.display = '-webkit-box';
    styleMap.WebkitLineClamp = String(maxLines);
    styleMap.WebkitBoxOrient = 'vertical';
    styleMap.overflow = 'hidden';
  }

  return (
    <Tag {...rest} className={className} style={{ ...styleMap, ...style }}>
      {children}
    </Tag>
  );
}
