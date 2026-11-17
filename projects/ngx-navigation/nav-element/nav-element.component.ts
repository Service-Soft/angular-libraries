import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { NavElement, NavMenuElement } from '@service-soft/ngx-navigation/navigation';

import { NavElementComponents } from './nav-element-components.model';
import { NavElementLayout } from './nav-element-layout.type';
import { NavElementView } from './nav-element-view.model';

/**
 * Shows one element of the navigation, like a link or a menu, in a row or in the drawer, with the component of the
 * map for its type: `<ngx-nav-element [element]="element" [components]="{ link: NavLinkComponent }" />`. A custom
 * element brings its own component. The navbar and the footer use it for their elements.
 */
@Component({
    selector: 'ngx-nav-element',
    templateUrl: './nav-element.component.html',
    imports: [NgComponentOutlet],
    host: {
        class: 'contents'
    }
})
export class NavElementComponent {
    /**
     * The element to show.
     */
    readonly element: InputSignal<NavElement | NavMenuElement> = input.required<NavElement | NavMenuElement>();

    /**
     * The component that shows each type of element. Nothing shows for a type without one.
     */
    readonly components: InputSignal<Partial<NavElementComponents>> = input.required<Partial<NavElementComponents>>();

    /**
     * Whether it is in a row, like of the navbar, or in the drawer.
     */
    readonly layout: InputSignal<NavElementLayout> = input<NavElementLayout>('row');

    /**
     * The component that shows the element, with its inputs.
     */
    // the components come from the map, so this one imports none of them, and a page only ships the ones it passes.
    protected readonly view: Signal<NavElementView | undefined> = computed(() => {
        const element: NavElement | NavMenuElement = this.element();
        if (element.type === 'custom') {
            return { component: element.component, inputs: element.inputs ?? {} };
        }
        const component: NavElementView['component'] | undefined = this.components()[element.type];
        return component == undefined ? undefined : { component, inputs: { element, layout: this.layout() } };
    });
}