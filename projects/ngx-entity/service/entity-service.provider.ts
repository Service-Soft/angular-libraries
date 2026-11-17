import { InjectionToken } from '@angular/core';

import { EntityService } from './entity.service';

/**
 * The service of the entities a part of the app is about, like the pages that EntityRouteUtilities resolves, which get
 * it from the providers of their routes.
 */
export const ENTITY_SERVICE: InjectionToken<EntityService<object>> = new InjectionToken<EntityService<object>>('ENTITY_SERVICE');