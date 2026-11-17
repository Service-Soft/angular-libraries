import { Component, computed, inject, Injector, input, InputSignal, Signal } from '@angular/core';
import { NavElementComponents, NavElementUtilities, NavRowComponent, NavRowItem } from '@service-soft/ngx-navigation/nav-element';
import { FooterRow, NavElement, NavigationUtilities, NavPositionGroups } from '@service-soft/ngx-navigation/navigation';

// set by the angular cli and false in production builds, which then leave out everything it guards.
declare const ngDevMode: unknown;

/**
 * The footer of the app, built from rows of elements like the navbar, each shown by the component for its type:
 * `<ngx-footer [rows]="footerRows" [components]="{ text: NavTextComponent, link: NavLinkComponent }" />`. On a narrow
 * screen the elements of a row wrap below each other.
 */
@Component({
    selector: 'ngx-footer',
    templateUrl: './footer.component.html',
    imports: [NavRowComponent],
    host: {
        class: 'block'
    }
})
export class FooterComponent {
    private readonly injector: Injector = inject(Injector);

    /**
     * The rows of the footer.
     */
    readonly rows: InputSignal<FooterRow[]> = input.required<FooterRow[]>();

    /**
     * The component that shows each type of element the rows have, like `{ link: NavLinkComponent }`, or one of your
     * own. Only these end up in the bundle. Development builds throw for a type of the rows without a component, and
     * for a component no element of the rows needs.
     */
    readonly components: InputSignal<Partial<NavElementComponents>> = input.required<Partial<NavElementComponents>>();

    /**
     * The elements of each row whose condition holds, by where in the row they are.
     */
    protected readonly rowViews: Signal<NavPositionGroups<NavRowItem>[]> = computed(() => {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            NavElementUtilities.validateComponents(this.components(), this.rows().flatMap(row => row.elements), 'The footer');
        }
        return this.rows().map(row => {
            const groups: NavPositionGroups<NavElement> = NavigationUtilities.groupByPosition(
                NavigationUtilities.findShown(row.elements, this.injector)
            );
            return { start: this.getRowItems(groups.start), center: this.getRowItems(groups.center), end: this.getRowItems(groups.end) };
        });
    });

    private getRowItems(elements: NavElement[]): NavRowItem[] {
        return elements.map(element => ({ element, classes: 'flex items-center' }));
    }
}