import { InjectionToken, Provider } from '@angular/core';

import { OfflineCacheConfigChanges } from './offline-cache-config-changes.model';
import { OfflineCacheConfig } from './offline-cache-config.model';

// long enough for a trip without a connection, short enough that nobody works with data of last month.
const DEFAULT_MAX_AGE_IN_MS: number = 7 * 24 * 60 * 60 * 1000;

/**
 * Which answers the offline cache keeps, and for how long. Set it with provideOfflineCache.
 */
export const OFFLINE_CACHE_CONFIG: InjectionToken<OfflineCacheConfig> = new InjectionToken<OfflineCacheConfig>('OFFLINE_CACHE_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The offline cache needs to know which answers to keep. Add provideOfflineCache({ urls }) '
            + 'to the providers of your app.');
    }
});

/**
 * Sets which answers the offlineCacheInterceptor keeps, and for how long: `provideOfflineCache({ urls: [apiUrl] })`.
 * Provide it in the application config, and provideOfflineConfig for who and where they belong to.
 * @param config - The urls, and what to change of the rest.
 * @returns The provider for OFFLINE_CACHE_CONFIG.
 */
export function provideOfflineCache(config: OfflineCacheConfigChanges): Provider {
    // no merging with a parent injector: the interceptor and the OfflineCacheService only see the root injector.
    const cacheConfig: OfflineCacheConfig = { maxAgeInMs: config.maxAgeInMs ?? DEFAULT_MAX_AGE_IN_MS, urls: config.urls };
    return { provide: OFFLINE_CACHE_CONFIG, useValue: cacheConfig };
}