import { Component, inject, input, InputSignal } from '@angular/core';

import { BreadcrumbsConfig } from './breadcrumbs-config.model';
import { BREADCRUMBS_CONFIG } from './breadcrumbs-config.provider';

/**
 * The way from the start of the app to the current page, as a navigation with a list of links:
 * `<ui-breadcrumbs>` with a `<ui-breadcrumb>` for each step, which holds your own link. Mark the current page with
 * `aria-current="page"`, on its link or on a span when it links nowhere, so screen readers announce it and it is
 * drawn as text. On a narrow screen the steps wrap.
 */
@Component({
    selector: 'ui-breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    host: {
        class: 'block'
    }
})
export class BreadcrumbsComponent {
    private readonly config: BreadcrumbsConfig = inject(BREADCRUMBS_CONFIG);

    /**
     * What screen readers call the navigation. The default comes from provideBreadcrumbsConfig.
     */
    readonly label: InputSignal<string> = input(this.config.label);
}