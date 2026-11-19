import { OfflineCacheConfig } from './offline-cache-config.model';

/**
 * What provideOfflineCache is given: the urls, and what to change of the rest. Values left out keep their defaults.
 */
export type OfflineCacheConfigChanges = Pick<OfflineCacheConfig, 'urls'> & Partial<Omit<OfflineCacheConfig, 'urls'>>;