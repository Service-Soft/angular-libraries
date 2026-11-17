import { Component, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBreadcrumb, NavigationService } from '@service-soft/ngx-navigation/navigation';
import { BreadcrumbComponent, BreadcrumbsComponent as UiBreadcrumbsComponent } from '@service-soft/ui/breadcrumbs';
import { IconComponent } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';

/**
 * The breadcrumbs of the current page, from its route: `<ngx-breadcrumbs />`. A step for the start page and one for
 * every route of the url, named by the breadcrumb in the data of the route or its title. Nothing on the page for unknown
 * urls. Change what screen readers call it with provideBreadcrumbsConfig of '@service-soft/ui/breadcrumbs', and the
 * name of the start page with provideNavigationConfig.
 */
@Component({
    selector: 'ngx-breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    imports: [BreadcrumbComponent, IconComponent, LinkComponent, RouterLink, UiBreadcrumbsComponent],
    host: {
        class: 'block'
    }
})
export class BreadcrumbsComponent {
    /**
     * The steps from the start page to the current one.
     */
    protected readonly breadcrumbs: Signal<NavBreadcrumb[]> = inject(NavigationService).breadcrumbs;
}