import { InjectionToken } from '@angular/core';

import { EntityOfflineWrites } from './entity-offline-writes.model';

/**
 * What lets the EntityService keep its changes while the user is offline. None by default, so its requests go like
 * any other. It comes with provideOfflineEntities of `@service-soft/ngx-entity/offline`.
 */
export const ENTITY_OFFLINE_WRITES: InjectionToken<EntityOfflineWrites | undefined> = new InjectionToken<EntityOfflineWrites | undefined>(
    'ENTITY_OFFLINE_WRITES',
    { providedIn: 'root', factory: () => undefined }
);