import { Component, computed, DestroyRef, ElementRef, inject, input, InputSignal, Signal } from '@angular/core';

import { FORM_CONFIG } from './form-config.provider';
import { FormLayout } from './form-layout.type';

// block: contents, so classes on <ui-form>, like grid, lay out the controls as if there was no <form> in between.
// inline: the field grows next to its submit button, below each other on narrow screens, where the button takes the
// full width. A visible label is above the box of the field, so the button moves down by the height of the label of
// ui-input-field, mb-1.5 and the line of text-label; a label hidden with hideLabel is sr-only, and the button stays up.
const LAYOUT_CLASSES: Record<FormLayout, string> = {
    block: 'contents',
    inline: `
        flex flex-col gap-2
        sm:flex-row sm:items-start
        sm:[&:has(label.sr-only)>button]:mt-0
        sm:[&>:not(button)]:min-w-0 sm:[&>:not(button)]:grow
        sm:[&>button]:mt-6.5 sm:[&>button]:shrink-0
    `
};

/**
 * A native form for controls and a submit button, like `<button ui-button type="submit">`. Listen to its native
 * submit event with (submit): the browser only fires it when every control is valid, also when the user presses
 * enter in a control.
 * When a control is invalid, the controls show their errors instead of the popups of the browser, and the form focuses
 * the first invalid one, which scrolls it into view, like the browser does for its popups.
 * The inline layout puts a single field and its submit button in a row, like a newsletter signup.
 * Unset inputs fall back to the values provided with provideFormConfig.
 */
@Component({
    selector: 'ui-form',
    templateUrl: './form.component.html',
    host: {
        class: 'block'
    }
})
export class FormComponent {
    /**
     * How the form lays out its content: as the classes on it say, or inline, one field and its submit button in a row
     * that stacks on narrow screens.
     */
    readonly layout: InputSignal<FormLayout> = input<FormLayout>(inject(FORM_CONFIG).layout);

    /**
     * The tailwind classes of the native form.
     */
    protected readonly classes: Signal<string> = computed(() => LAYOUT_CLASSES[this.layout()]);

    // whether the first invalid control of the current submit got focus already.
    private focusedInvalid: boolean = false;

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        // invalid doesn't bubble, so it can only be seen while capturing. The browser fires it for every invalid
        // control of a submit at once, in the order of the page.
        const focusFirstInvalid: (event: Event) => void = event => this.focusFirstInvalid(event);
        element.addEventListener('invalid', focusFirstInvalid, { capture: true });
        inject(DestroyRef).onDestroy(() => element.removeEventListener('invalid', focusFirstInvalid, { capture: true }));
    }

    /**
     * Stops the browser from loading another page, which it does for a native submit.
     * @param event - The submit event.
     */
    protected preventNavigation(event: SubmitEvent): void {
        event.preventDefault();
    }

    // the controls cancel invalid to hide the popups, which also stops the browser from focusing the first of them.
    private focusFirstInvalid(event: Event): void {
        if (this.focusedInvalid || !(event.target instanceof HTMLElement)) {
            return;
        }
        this.focusedInvalid = true;
        event.target.focus();
        // not a microtask: the browser runs those between the invalid events of the same submit.
        setTimeout(() => this.focusedInvalid = false);
    }
}