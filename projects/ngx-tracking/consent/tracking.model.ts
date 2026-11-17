import { Type } from '@angular/core';

import { TrackingService } from './tracking.service';

/**
 * A tracking the user can allow or not, as the consent dialog shows it.
 */
export type Tracking = {
    /**
     * The name of the tracking, like 'Google Analytics'.
     */
    name: string,
    /**
     * What the tracking does with the data and who receives it, as paragraphs.
     */
    description: string[],
    /**
     * The service that tracks, like GoogleAnalyticsService.
     */
    service: Type<TrackingService>
};