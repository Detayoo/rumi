/**
 * design-tokens — typed token definitions.
 *
 * One vocabulary, two platforms: browser and tv share these token *names*; the css value files
 * (browser.css / tv.css) define the platform-appropriate *values* (tv spacing/type are larger).
 * Components only ever reference token names — never raw px/hex — per design-system.md §1.2.
 */

export const spacingTokens = [
  'none',
  '3xs',
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
  '3xl',
] as const;
export type SpacingToken = (typeof spacingTokens)[number];

export const radiusTokens = ['none', 'xs', 's', 'm', 'l', 'xl', 'full'] as const;
export type RadiusToken = (typeof radiusTokens)[number];

export const surfaceTokens = ['base', 'raised', 'overlay', 'sunken'] as const;
export type SurfaceToken = `surface.${(typeof surfaceTokens)[number]}`;

export const contentTokens = [
  'primary',
  'secondary',
  'tertiary',
  'inverse',
  'link',
] as const;
export type ContentToken = `content.${(typeof contentTokens)[number]}`;

export const borderTokens = ['subtle', 'default', 'strong', 'focus'] as const;
export type BorderToken = `border.${(typeof borderTokens)[number]}`;

export const actionTokens = [
  'primary.default',
  'primary.hover',
  'primary.pressed',
  'primary.disabled',
  'secondary.default',
  'secondary.hover',
] as const;
export type ActionToken = `action.${(typeof actionTokens)[number]}`;

export const feedbackTokens = ['success', 'warning', 'danger', 'info'] as const;
export type FeedbackToken = `feedback.${(typeof feedbackTokens)[number]}`;

export const spoilerTokens = ['safe', 'caution', 'full'] as const;
export type SpoilerToken = `spoiler.${(typeof spoilerTokens)[number]}`;

/** anything usable as a background fill */
export type BackgroundToken =
  | SurfaceToken
  | ActionToken
  | FeedbackToken
  | SpoilerToken;

export const textSizes = [
  'display',
  'title-lg',
  'title-md',
  'title-sm',
  'body-lg',
  'body-md',
  'body-sm',
  'caption',
] as const;
export type TextSize = (typeof textSizes)[number];

export const fontWeights = ['regular', 'medium', 'bold'] as const;
export type FontWeight = (typeof fontWeights)[number];

export const elevationTokens = ['none', 'low', 'medium', 'high'] as const;
export type ElevationToken = (typeof elevationTokens)[number];

/** dot-namespaced token -> css custom property reference */
export function toCssVar(token: string): string {
  return `var(--${token.replace(/\./g, '-')})`;
}

/** css custom property *name* (without var()) for a dot-namespaced token */
export function cssVarName(token: string): string {
  return `--${token.replace(/\./g, '-')}`;
}
