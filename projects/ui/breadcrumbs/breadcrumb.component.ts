import { Component } from '@angular/core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from '@service-soft/ui/icon';

/**
 * A step of `<ui-breadcrumbs>`, with your own link inside, drawn by ui-link: `<ui-breadcrumb><a ui-link
 * routerLink="/orders">Orders</a></ui-breadcrumb>`. Every step after the first is separated from the one before by an
 * arrow.
 */
@Component({
    selector: 'ui-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    imports: [IconComponent],
    host: {
        // a list item of the list of the breadcrumbs, without being an li, which only the consumer could write.
        role: 'listitem',
        class: 'group flex items-center gap-2'
    }
})
export class BreadcrumbComponent {
    /**
     * The arrow between two steps.
     */
    protected readonly separator: typeof faChevronRight = faChevronRight;
}