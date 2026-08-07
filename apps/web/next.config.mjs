import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@screen-companion/design-tokens',
    '@screen-companion/ui',
    '@screen-companion/types',
    '@screen-companion/ai-contracts',
    '@screen-companion/validation',
    '@screen-companion/api-client',
    '@screen-companion/shared-utils',
    '@screen-companion/provider-adapters',
  ],
};

export default nextConfig;
