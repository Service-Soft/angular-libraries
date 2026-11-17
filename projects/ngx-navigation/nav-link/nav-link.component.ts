import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { NavAnchorComponent, NavElementLayout } from '@service-soft/ngx-navigation/nav-element';
import { NavigationUtilities, NavLink, NavLinkView } from '@service-soft/ngx-navigation/navigation';

/**
 * Shows a link as an item of the navigation, over the full width in the drawer: the component for links in the
 * components of the navbar and the footer, `{ link: NavLinkComponent }`.
 */
@Component({
    selector: 'ngx-nav-link',
    templateUrl: './nav-link.component.html',
    imports: [NavAnchorComponent],
    host: {
        class: 'contents'
    }
})
export class NavLinkComponent {
    /**
     * The link.
     */
    readonly element: InputSignal<NavLink> = input.required<NavLink>();

    /**
     * Whether it is in a row or in the drawer.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();

    /**
     * The attributes of the link.
     */
    protected readonly link: Signal<NavLinkView> = computed(() => NavigationUtilities.getLinkView(this.element()));
}