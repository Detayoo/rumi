import type { Config } from 'tailwindcss';
import { tailwindPreset } from '@screen-companion/design-tokens';

export default {
  presets: [tailwindPreset],
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
} satisfies Config;
