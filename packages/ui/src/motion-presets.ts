import type { Transition, Variants } from 'motion/react';

/**
 * motion presets — the single place curves/durations live, mirroring the design-token
 * motion scale (design-system.md §2.6): duration.fast 100ms / default 200ms / slow 320ms,
 * easing.standard cubic-bezier(0.2,0,0,1), easing.decelerate cubic-bezier(0,0,0,1).
 *
 * pure data — safe to import anywhere, including server components. if the css tokens
 * change, change them here — never fork a parallel curve.
 * all transforms are full transform strings: motion's x/y/scale shorthands are not
 * hardware-accelerated and drop frames while the page is busy (emil-design-eng).
 */

export const durationFast = 0.1;
export const durationDefault = 0.2;
export const durationSlow = 0.32;

/** cubic-bezier(0.2, 0, 0, 1) — the standard token */
export const easeStandard: [number, number, number, number] = [0.2, 0, 0, 1];
/** cubic-bezier(0, 0, 0, 1) — the decelerate token: instant start, strong settle */
export const easeDecelerate: [number, number, number, number] = [0, 0, 0, 1];

export const enterTransition: Transition = {
  duration: durationDefault,
  ease: easeDecelerate,
};

export const slowEnterTransition: Transition = {
  duration: durationSlow,
  ease: easeDecelerate,
};

/** press feedback — a spring without bounce: decisive, not playful */
export const pressSpring: Transition = {
  type: 'spring',
  duration: 0.35,
  bounce: 0,
};

/**
 * fade-up entrance, the default for content entering a screen.
 * opacity + a small rise, never scale(0) (emil-design-eng).
 */
export function fadeUp(distance = 10, transition: Transition = enterTransition): Variants {
  return {
    initial: { opacity: 0, transform: `translateY(${distance}px)` },
    enter: { opacity: 1, transform: 'translateY(0px)', transition },
    exit: { opacity: 0, transform: `translateY(${distance}px)`, transition },
  };
}

/** opacity-only variant for reduced-motion — movement removed, comprehension kept */
export function fadeOnly(transition: Transition = enterTransition): Variants {
  return {
    initial: { opacity: 0 },
    enter: { opacity: 1, transition },
    exit: { opacity: 0, transition },
  };
}

/** parent variant for staggering children — 50ms between items (30–80ms per the recipe) */
export const staggerContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

/** scale-in for centered panels (modals, pairing) — 0.96, never 0 */
export const scaleIn: Variants = {
  initial: { opacity: 0, transform: 'scale(0.96)' },
  enter: { opacity: 1, transform: 'scale(1)', transition: slowEnterTransition },
  exit: { opacity: 0, transform: 'scale(0.96)', transition: slowEnterTransition },
};
