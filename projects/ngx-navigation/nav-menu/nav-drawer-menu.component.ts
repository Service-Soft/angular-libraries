import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, Injector, input, InputSignal, Signal } from '@angular/core';
import { NavButtonComponent } from '@service-soft/ngx-navigation/nav-button';
import { NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavigationUtilities, NavMenu, NavMenuElement } from '@service-soft/ngx-navigation/navigation';
import { DetailsComponent, SummaryComponent } from '@service-soft/ui/details';

/**
 * Shows a menu in the drawer, as a section that opens, with its elements below each other and its submenus inside.
 */
// a popover is no place to scroll through below each other, which is what the drawer is for.
@Component({
    selector: 'ngx-nav-drawer-menu',
    templateUrl: './nav-drawer-menu.component.html',
    imports: [DetailsComponent, NavButtonComponent, NavLabelComponent, NavLinkComponent, NgComponentOutlet, SummaryComponent],
    host: {
        class: 'block'
    }
})
export class NavDrawerMenuComponent {
    private readonly injector: Injector = inject(Injector);

    /**
     * The menu.
     */
    readonly element: InputSignal<NavMenu> = input.required<NavMenu>();

    /**
     * The elements of the menu whose condition holds.
     */
    protected readonly shown: Signal<NavMenuElement[]> = computed(() => {
        return NavigationUtilities.findShown(this.element().elements, this.injector);
    });
}