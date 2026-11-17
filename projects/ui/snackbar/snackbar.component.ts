import { Component, computed, input, InputSignal, Signal } from '@angular/core';

import { SnackbarColor } from './snackbar-color.type';

// fixed at the bottom of the screen, above the content. The host has no box of its own, only the message has, so it
// never covers anything while it is empty, and clicks pass through around the message.
const SNACKBAR_CLASSES: string = 'pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center';

// neutral is on-surface as the background and surface as the text: the reverse of a checked pair, which has the same
// contrast, and stands out from the page in both modes. A theme color has its on- color as the text. A transparent
// border keeps the shape of the message in forced colors mode, where backgrounds are gone. Snackbars sit on elevation
// 3, like dialogs.
const MESSAGE_CLASSES: Record<SnackbarColor, string> = {
    neutral: `
        pointer-events-auto max-w-xl rounded-snackbar border border-transparent bg-on-surface px-4 py-3 text-body-sm text-surface shadow-3
    `,
    primary: `
        pointer-events-auto max-w-xl rounded-snackbar border border-transparent bg-primary px-4 py-3 text-body-sm text-on-primary shadow-3
    `,
    secondary: `
        pointer-events-auto max-w-xl rounded-snackbar border border-transparent bg-secondary px-4 py-3 text-body-sm text-on-secondary
        shadow-3
    `,
    error: 'pointer-events-auto max-w-xl rounded-snackbar border border-transparent bg-error px-4 py-3 text-body-sm text-on-error shadow-3',
    success: `
        pointer-events-auto max-w-xl rounded-snackbar border border-transparent bg-success px-4 py-3 text-body-sm text-on-success shadow-3
    `
};

/**
 * The live region the SnackbarService shows its messages in. Internal to the SnackbarService: open messages with it
 * instead of placing this element.
 */
@Component({
    selector: 'ui-snackbar',
    templateUrl: './snackbar.component.html',
    host: {
        class: SNACKBAR_CLASSES,
        role: 'status'
    }
})
export class SnackbarComponent {
    /**
     * The message that shows, or an empty string while none does.
     */
    readonly message: InputSignal<string> = input('');

    /**
     * The color of the message.
     */
    readonly color: InputSignal<SnackbarColor> = input<SnackbarColor>('neutral');

    /**
     * The tailwind classes of the message, by its color.
     */
    protected readonly messageClasses: Signal<string> = computed(() => MESSAGE_CLASSES[this.color()]);
}