import { Component, input, InputSignal } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { NavElementLayout, NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavMenu } from '@service-soft/ngx-navigation/navigation';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { MenuComponent, MenuTriggerDirective } from '@service-soft/ui/menu';

import { NavDrawerMenuComponent } from './nav-drawer-menu.component';
import { NavMenuItemsComponent } from './nav-menu-items.component';

/**
 * Shows a menu: a button that opens it in a row, a section that opens in the drawer. The component for menus in the
 * components of the navbar and the footer, `{ menu: NavMenuComponent }`. It shows the links, buttons and menus inside
 * itself, so they need no components of their own.
 */
@Component({
    selector: 'ngx-nav-menu',
    templateUrl: './nav-menu.component.html',
    imports: [
        ButtonComponent,
        IconComponent,
        MenuComponent,
        MenuTriggerDirective,
        NavDrawerMenuComponent,
        NavLabelComponent,
        NavMenuItemsComponent
    ],
    host: {
        class: 'contents'
    }
})
export class NavMenuComponent {
    /**
     * The menu.
     */
    readonly element: InputSignal<NavMenu> = input.required<NavMenu>();

    /**
     * Whether it is in a row or in the drawer.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();

    /**
     * The icon that shows the button opens a menu.
     */
    protected readonly menuIcon: typeof faChevronDown = faChevronDown;
}