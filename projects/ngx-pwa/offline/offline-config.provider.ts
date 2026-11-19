import { InjectionToken, Provider } from '@angular/core';

import { OfflineConfigChanges } from './offline-config-changes.model';
import { OfflineConfig } from './offline-config.model';

const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
    headers: {},
    scope: () => undefined
};

/**
 * Who the changes made offline and the answers of the offline cache belong to, and where they were made. Change it
 * with provideOfflineConfig.
 */
export const OFFLINE_CONFIG: InjectionToken<OfflineConfig> = new InjectionToken<OfflineConfig>('OFFLINE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_OFFLINE_CONFIG
});

/**
 * Sets who the changes made offline and the answers of the offline cache belong to, and the headers that tell apart
 * where they were made: `provideOfflineConfig({ headers: { 'x-tenant-id': () => inject(AuthService).activeTenantId() },
 * scope: () => inject(AuthService).authData()?.userId })`. Provide it in the application config.
 * @param config - The values to change.
 * @returns The provider for OFFLINE_CONFIG.
 */
export function provideOfflineConfig(config: OfflineConfigChanges): Provider {
    // no merging with a parent injector: the OfflineService lives in the root injector and never sees a config further down.
    const offlineConfig: OfflineConfig = {
        headers: config.headers ?? DEFAULT_OFFLINE_CONFIG.headers,
        scope: config.scope ?? DEFAULT_OFFLINE_CONFIG.scope
    };
    return { provide: OFFLINE_CONFIG, useValue: offlineConfig };
}