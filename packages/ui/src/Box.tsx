import type { ChangeEventHandler, CSSProperties, FormEvent, KeyboardEvent, ReactNode, Ref } from 'react';
import {
  toCssVar,
  type BackgroundToken,
  type BorderToken,
  type ElevationToken,
  type RadiusToken,
  type SpacingToken,
} from '@screen-companion/design-tokens';

/**
 * Box — the single styling primitive (design-system.md §3).
 * everything else in the ui package renders a Box (or a small tree of them) under the hood.
 * style is always token + prop, never raw values: the style map below only ever emits
 * css custom property references, which is what makes the same component correct on
 * browser and tv (browser.css vs tv.css provide the platform values).
 */

export interface BoxProps {
  // layout
  display?: 'flex' | 'grid' | 'block' | 'inline-flex' | 'none';
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  gap?: SpacingToken;

  // spacing
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingBottom?: SpacingToken;

  // sizing
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;

  // appearance
  background?: BackgroundToken;
  radius?: RadiusToken;
  /** border.color tokens plus feedback tints for state surfaces (semantic extension of the scale, per §1.2) */
  border?: BorderToken | 'feedback.danger' | 'feedback.warning';
  borderWidth?: 'none' | 'thin' | 'thick';
  shadow?: ElevationToken;

  // interaction
  /** renders a border.focus ring on :focus-visible (browser) / .sc-focused (tv). required on anything with onPress (§1.5). */
  focusable?: boolean;
  /** tv programmatic focus state — set on screen entry per §7 a11y rules */
  focused?: boolean;
  /** unified click (browser) / ok-button (tv) handler */
  onPress?: () => void;

  // native escape hatches (form elements, semantics)
  ref?: Ref<HTMLElement>;
  as?: 'div' | 'button' | 'a' | 'section' | 'article' | 'header' | 'footer' | 'nav' | 'main' | 'form' | 'label' | 'ul' | 'li' | 'span' | 'input';
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-selected'?: boolean;
  'aria-busy'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'text' | 'search' | 'email' | 'password';
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  htmlFor?: string;
  href?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function mapAlign(value: BoxProps['align']): CSSProperties['alignItems'] {
  switch (value) {
    case 'start':
      return 'flex-start';
    case 'end':
      return 'flex-end';
    default:
      return value;
  }
}

function mapJustify(value: BoxProps['justify']): CSSProperties['justifyContent'] {
  switch (value) {
    case 'start':
      return 'flex-start';
    case 'end':
      return 'flex-end';
    case 'between':
      return 'space-between';
    case 'around':
      return 'space-around';
    default:
      return value;
  }
}

const BORDER_WIDTHS: Record<'none' | 'thin' | 'thick', string> = {
  none: '0px',
  thin: '1px',
  thick: '2px',
};

export function Box(props: BoxProps): ReactNode {
  const {
    display = 'block',
    direction,
    align,
    justify,
    wrap,
    gap,
    padding,
    paddingX,
    paddingY,
    paddingTop,
    paddingBottom,
    width,
    height,
    minWidth,
    maxWidth,
    background,
    radius,
    border,
    borderWidth,
    shadow,
    focusable = false,
    focused = false,
    onPress,
    as: Tag = 'div',
    children,
    className,
    style,
    ...rest
  } = props;

  const styleMap: CSSProperties = {
    display: display === 'none' ? 'none' : display,
    flexDirection: direction,
    alignItems: align === undefined ? undefined : mapAlign(align),
    justifyContent: justify === undefined ? undefined : mapJustify(justify),
    flexWrap: wrap ? 'wrap' : undefined,
    gap: gap === undefined ? undefined : gap === 'none' ? '0px' : toCssVar(`spacing.${gap}`),
    width,
    height,
    minWidth,
    maxWidth,
    backgroundColor: background === undefined ? undefined : toCssVar(background),
    borderRadius: radius === undefined ? undefined : toCssVar(`radius.${radius}`),
    borderColor: border === undefined ? undefined : toCssVar(border),
    borderWidth: borderWidth === undefined ? undefined : BORDER_WIDTHS[borderWidth],
    borderStyle: border === undefined ? undefined : 'solid',
    boxShadow: shadow === undefined ? undefined : toCssVar(`shadow.${shadow}`),
  };

  // padding is always emitted as longhands, never the `padding` shorthand: motion's style
  // pipeline mangles the shorthand (renders empty values), so every side must be explicit.
  // precedence: padding < paddingX/paddingY < paddingTop/paddingBottom.
  const padValue = (token: SpacingToken | undefined): string | undefined =>
    token === undefined ? undefined : token === 'none' ? '0px' : toCssVar(`spacing.${token}`);

  const all = padValue(padding);
  if (all !== undefined) {
    styleMap.paddingTop = all;
    styleMap.paddingRight = all;
    styleMap.paddingBottom = all;
    styleMap.paddingLeft = all;
  }
  const x = padValue(paddingX);
  if (x !== undefined) {
    styleMap.paddingLeft = x;
    styleMap.paddingRight = x;
  }
  const y = padValue(paddingY);
  if (y !== undefined) {
    styleMap.paddingTop = y;
    styleMap.paddingBottom = y;
  }
  const top = padValue(paddingTop);
  if (top !== undefined) styleMap.paddingTop = top;
  const bottom = padValue(paddingBottom);
  if (bottom !== undefined) styleMap.paddingBottom = bottom;

  const classes = [
    focusable ? 'sc-focusable' : undefined,
    focused ? 'sc-focused' : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onPress) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  };

  return (
    // rest is intentionally loosely spread: Box is a pass-through primitive and the
    // as-prop union spans button/input/form semantics that TS can't fully reconcile.
    <Tag
      {...(rest as Record<string, unknown>)}
      className={classes || undefined}
      style={{ ...styleMap, ...style }}
      tabIndex={focusable && Tag !== 'button' && Tag !== 'input' ? 0 : undefined}
      onClick={onPress}
      onKeyDown={onPress ? handleKeyDown : undefined}
    >
      {children}
    </Tag>
  );
}
