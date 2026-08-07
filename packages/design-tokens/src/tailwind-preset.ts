import type { Config } from 'tailwindcss';
import {
  spacingTokens,
  radiusTokens,
  surfaceTokens,
  contentTokens,
  borderTokens,
  actionTokens,
  feedbackTokens,
  spoilerTokens,
  textSizes,
  fontWeights,
  elevationTokens,
  cssVarName,
} from './tokens';

/**
 * maps design tokens into a tailwind theme extension.
 * every value references the css custom property — the same one the tv app consumes —
 * so the web app can never drift from the token source of truth.
 */
export const tailwindPreset = {
  theme: {
    extend: {
      spacing: Object.fromEntries(spacingTokens.map((t) => [t, `var(${cssVarName(t)})`])),
      borderRadius: Object.fromEntries(
        radiusTokens.map((t) => [t, `var(${cssVarName(t)})`]),
      ),
      colors: {
        surface: Object.fromEntries(
          surfaceTokens.map((t) => [`${t}`, `var(${cssVarName(`surface.${t}`)})`]),
        ),
        content: Object.fromEntries(
          contentTokens.map((t) => [`${t}`, `var(${cssVarName(`content.${t}`)})`]),
        ),
        border: Object.fromEntries(
          borderTokens.map((t) => [`${t}`, `var(${cssVarName(`border.${t}`)})`]),
        ),
        action: Object.fromEntries(
          actionTokens.map((t) => [`${t.replace('.', '-')}`, `var(${cssVarName(`action.${t}`)})`]),
        ),
        feedback: Object.fromEntries(
          feedbackTokens.map((t) => [`${t}`, `var(${cssVarName(`feedback.${t}`)})`]),
        ),
        spoiler: Object.fromEntries(
          spoilerTokens.map((t) => [`${t}`, `var(${cssVarName(`spoiler.${t}`)})`]),
        ),
      },
      fontSize: Object.fromEntries(
        textSizes.map((t) => [
          t,
          [`var(${cssVarName(`text-${t}`)})`, `var(${cssVarName(`leading-${t}`)})`],
        ]),
      ),
      fontWeight: Object.fromEntries(
        fontWeights.map((t) => [t, `var(${cssVarName(`weight-${t}`)})`]),
      ),
      boxShadow: Object.fromEntries(
        elevationTokens.map((t) => [t, `var(${cssVarName(`shadow-${t}`)})`]),
      ),
      transitionDuration: {
        fast: 'var(--duration-fast)',
        default: 'var(--duration-default)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--easing-standard)',
        decelerate: 'var(--easing-decelerate)',
      },
    },
  },
} satisfies Config;

export default tailwindPreset;
