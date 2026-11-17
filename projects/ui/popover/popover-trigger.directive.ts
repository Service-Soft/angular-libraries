import { Directive, input, InputSignal } from '@angular/core';

import { PopoverComponent } from './popover.component';

/**
 * Opens and closes a popover: `<button ui-button type="button" [uiPopoverTrigger]="filter">`. The popover opens below
 * it.
 */
@Directive({
    selector: 'button[uiPopoverTrigger]',
    host: {
        '[attr.popovertarget]': 'uiPopoverTrigger().id',
        '[style.anchor-name]': 'uiPopoverTrigger().anchorName'
    }
})
export class PopoverTriggerDirective {
    /**
     * The popover to open.
     */
    readonly uiPopoverTrigger: InputSignal<PopoverComponent> = input.required<PopoverComponent>();
}