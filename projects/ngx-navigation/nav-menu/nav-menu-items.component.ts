import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, Injector, input, InputSignal, runInInjectionContext, Signal } from '@angular/core';
import { NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavButton, NavigationUtilities, NavMenuElement } from '@service-soft/ngx-navigation/navigation';
import { MenuComponent, MenuItemComponent } from '@service-soft/ui/menu';

import { NavMenuLinkComponent } from './nav-menu-link.component';

/**
 * The items of a menu of the navigation, inside a `<ui-menu>`: links, buttons and submenus.
 */
@Component({
    selector: 'ngx-nav-menu-items',
    templateUrl: './nav-menu-items.component.html',
    imports: [MenuComponent, MenuItemComponent, NavLabelComponent, NavMenuLinkComponent, NgComponentOutlet],
    host: {
        // the items are the content of the menu, as if there was no wrapper.
        class: 'contents'
    }
})
export class NavMenuItemsComponent {
    private readonly injector: Injector = inject(Injector);

    /**
     * The elements of the menu.
     */
    readonly elements: InputSignal<NavMenuElement[]> = input.required<NavMenuElement[]>();

    /**
     * The elements whose condition holds.
     */
    protected readonly shown: Signal<NavMenuElement[]> = computed(() => NavigationUtilities.findShown(this.elements(), this.injector));

    /**
     * Does what a button does, in an injection context.
     * @param button - The button that was chosen.
     */
    protected run(button: NavButton): void {
        runInInjectionContext(this.injector, button.action);
    }
}