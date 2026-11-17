import { Component, input, InputSignal } from '@angular/core';
import { NavElementLayout } from '@service-soft/ngx-navigation/nav-element';
import { NavText } from '@service-soft/ngx-navigation/navigation';

/**
 * Shows plain text: the component for text in the components of the navbar and the footer, `{ text: NavTextComponent }`.
 */
@Component({
    selector: 'ngx-nav-text',
    templateUrl: './nav-text.component.html',
    host: {
        class: 'contents'
    }
})
export class NavTextComponent {
    /**
     * The text.
     */
    readonly element: InputSignal<NavText> = input.required<NavText>();

    /**
     * Whether it is in a row or in the drawer, where text looks the same.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();
}