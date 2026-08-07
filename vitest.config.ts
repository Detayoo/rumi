import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.{ts,tsx}', 'apps/web/lib/**/*.test.ts'],
    environment: 'node',
  },
});
