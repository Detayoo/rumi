/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
