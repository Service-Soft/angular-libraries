import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '@service-soft/ui/button';
import { ResultActionsComponent, ResultComponent } from '@service-soft/ui/result';

import { NotFoundConfig } from './not-found-config.model';
import { NOT_FOUND_CONFIG } from './not-found-config.provider';
import { NotFoundRouteData } from './not-found-route-data.model';

/**
 * The page for unknown urls, a centered ui-result with an icon, its heading, a text and a link back: the component of
 * the route with the path '**'. It shows the values of provideNotFoundConfig, or the ones in `notFound` of the data of
 * its route.
 */
@Component({
    selector: 'ngx-not-found',
    templateUrl: './not-found.component.html',
    imports: [ButtonComponent, RouterLink, ResultComponent, ResultActionsComponent],
    host: {
        class: 'block'
    }
})
export class NotFoundComponent {
    private readonly data: NotFoundRouteData = inject(ActivatedRoute).snapshot.data;

    /**
     * What the page shows.
     */
    protected readonly content: NotFoundConfig = { ...inject(NOT_FOUND_CONFIG), ...this.data.notFound };
}