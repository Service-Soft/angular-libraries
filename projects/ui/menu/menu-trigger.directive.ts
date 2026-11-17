import { Directive, input, InputSignal } from '@angular/core';

import { MenuComponent } from './menu.component';

/**
 * Opens and closes a menu: `<button ui-button type="button" [uiMenuTrigger]="menu">`. The menu opens below it.
 */
@Directive({
    selector: 'button[uiMenuTrigger]',
    host: {
        '[attr.popovertarget]': 'uiMenuTrigger().id',
        '[style.anchor-name]': 'uiMenuTrigger().anchorName'
    }
})
export class MenuTriggerDirective {
    /**
     * The menu to open.
     */
    readonly uiMenuTrigger: InputSignal<MenuComponent> = input.required<MenuComponent>();
}