import { Provider } from '@angular/core';
import { ENTITY_OFFLINE_WRITES } from '@service-soft/ngx-entity/service';

import { OfflineEntityWrites } from './offline-entity-writes.service';

/**
 * Lets every EntityService of the app create, change and delete entities while the user is offline, with
 * `@service-soft/ngx-pwa`: their requests are kept and synced later, and their pages show the changes made offline.
 * Provide it in the application config, next to the offlineInterceptor of `@service-soft/ngx-pwa/offline`:
 * `provideHttpClient(withInterceptors([authInterceptor, offlineInterceptor])), provideOfflineEntities()`.
 * @returns The provider for ENTITY_OFFLINE_WRITES.
 */
export function provideOfflineEntities(): Provider {
    return { provide: ENTITY_OFFLINE_WRITES, useExisting: OfflineEntityWrites };
}