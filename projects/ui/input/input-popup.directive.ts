import { afterNextRender, Directive, ElementRef, inject, input, InputSignal } from '@angular/core';

/**
 * Shows the list of options an input opens, like the one of an autocomplete, in the top layer as a popover, placed
 * below the input, so no container cuts it off, like a dialog that scrolls. The input sets the same anchor-name:
 * `<input [style.anchor-name]="anchorName">` and `<div [uiInputPopup]="anchorName">`.
 */
@Directive({
    selector: '[uiInputPopup]',
    host: {
        // manual: the combobox decides when the list opens and closes, by rendering it or not.
        popover: 'manual',
        '[style.position-anchor]': 'uiInputPopup()'
    }
})
export class InputPopupDirective {
    /**
     * The anchor-name of the input the list belongs to, like '--ui-input-3'.
     */
    readonly uiInputPopup: InputSignal<string> = input.required<string>();

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => element.showPopover());
    }
}