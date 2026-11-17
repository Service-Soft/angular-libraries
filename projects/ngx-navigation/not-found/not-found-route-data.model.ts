import { Data } from '@angular/router';

import { NotFoundConfig } from './not-found-config.model';

/**
 * What the page for unknown urls reads from the data of its route.
 */
export type NotFoundRouteData = Data & {
    /**
     * What to show on this route instead of the values of provideNotFoundConfig.
     */
    notFound?: Partial<NotFoundConfig>
};