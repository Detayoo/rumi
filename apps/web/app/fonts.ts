import localFont from 'next/font/local';

/**
 * PolySans (trial cut, personal-use license) — self-hosted via next/font/local.
 * the family ships four static weights (slim 300 / neutral 400 / median 600 / bulky 700);
 * the design-token weight scale is pinned to exactly these — nothing is synthesized.
 */

export const polysans = localFont({
  src: [
    { path: '../fonts/polysans-slim.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/polysans-neutral.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/polysans-median.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/polysans-bulky.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-polysans',
  display: 'swap',
});

/** wide cut — used for display/title-lg via the --font-family-display token */
export const polysansWide = localFont({
  src: [
    { path: '../fonts/polysans-slim-wide.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/polysans-neutral-wide.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/polysans-median-wide.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/polysans-bulky-wide.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-polysans-wide',
  display: 'swap',
});
