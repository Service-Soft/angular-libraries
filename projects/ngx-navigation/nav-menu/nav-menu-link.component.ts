import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavigationUtilities, NavLink, NavLinkView } from '@service-soft/ngx-navigation/navigation';
import { MenuLinkComponent } from '@service-soft/ui/menu';

/**
 * Shows a link inside a menu, which closes the menu when followed.
 */
@Component({
    selector: 'ngx-nav-menu-link',
    templateUrl: './nav-menu-link.component.html',
    imports: [MenuLinkComponent, NavLabelComponent, RouterLink, RouterLinkActive],
    host: {
        class: 'contents'
    }
})
export class NavMenuLinkComponent {
    /**
     * The link.
     */
    readonly element: InputSignal<NavLink> = input.required<NavLink>();

    /**
     * The attributes of the link.
     */
    protected readonly link: Signal<NavLinkView> = computed(() => NavigationUtilities.getLinkView(this.element()));
}