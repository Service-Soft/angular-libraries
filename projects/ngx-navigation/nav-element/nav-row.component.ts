import { Component, input, InputSignal } from '@angular/core';
import { NavPositionGroups } from '@service-soft/ngx-navigation/navigation';

import { NavElementComponents } from './nav-element-components.model';
import { NavElementComponent } from './nav-element.component';
import { NavRowItem } from './nav-row-item.model';

/**
 * A row of the navbar or the footer, with its elements at the start, in the center and at the end:
 * `<ngx-nav-row [groups]="groups" [components]="components" />`. What you put inside comes last at the end, like the button that opens the drawer.
 * The groups wrap below each other when they don't fit, instead of overflowing a narrow screen.
 */
@Component({
    selector: 'ngx-nav-row',
    templateUrl: './nav-row.component.html',
    imports: [NavElementComponent],
    host: {
        class: 'flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2'
    }
})
export class NavRowComponent {
    /**
     * The elements of the row, by where in the row they are.
     */
    readonly groups: InputSignal<NavPositionGroups<NavRowItem>> = input.required<NavPositionGroups<NavRowItem>>();

    /**
     * The component that shows each type of element.
     */
    readonly components: InputSignal<Partial<NavElementComponents>> = input.required<Partial<NavElementComponents>>();
}