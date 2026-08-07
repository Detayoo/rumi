/**
 * client-safe mock exports — import from '@screen-companion/provider-adapters/mock'.
 * the barrel ('.') includes the real vendor adapters + SDKs and is server-only;
 * this subpath never pulls node-only code into a client bundle.
 */
export { MockMetadataProvider } from './mock-metadata';
