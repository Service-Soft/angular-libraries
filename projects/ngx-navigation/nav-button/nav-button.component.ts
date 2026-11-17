import { Component, inject, Injector, input, InputSignal, runInInjectionContext } from '@angular/core';
import { NavElementLayout, NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavButton } from '@service-soft/ngx-navigation/navigation';
import { ButtonComponent } from '@service-soft/ui/button';
import { LinkComponent } from '@service-soft/ui/link';

/**
 * Shows a button, which does what its action says in an injection context: the component for buttons in the
 * components of the navbar and the footer, `{ button: NavButtonComponent }`. In the drawer it lines up with the links
 * below each other, so it is drawn like them.
 */
@Component({
    selector: 'ngx-nav-button',
    templateUrl: './nav-button.component.html',
    imports: [ButtonComponent, LinkComponent, NavLabelComponent],
    host: {
        class: 'contents'
    }
})
export class NavButtonComponent {
    private readonly injector: Injector = inject(Injector);

    /**
     * The button.
     */
    readonly element: InputSignal<NavButton> = input.required<NavButton>();

    /**
     * Whether it is in a row or in the drawer.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();

    /**
     * Does what the button does, in an injection context.
     */
    protected run(): void {
        runInInjectionContext(this.injector, this.element().action);
    }
}