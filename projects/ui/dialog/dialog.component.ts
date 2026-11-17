import { booleanAttribute, Component, computed, ElementRef, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal, viewChild } from '@angular/core';

import { DialogSize } from './dialog-size.type';

let nextHeadingId: number = 0;

// the browser centers a modal dialog with margin auto, which tailwind's preflight sets to 0, so m-auto brings it back. It
// keeps the dialog smaller than the viewport, overflow-auto scrolls content that doesn't fit instead of cutting it off.
// A dialog sits on elevation 3.
const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
    md: 'm-auto w-full max-w-lg overflow-auto rounded-dialog bg-surface p-6 text-on-surface shadow-3 backdrop:bg-scrim',
    lg: 'm-auto w-full max-w-4xl overflow-auto rounded-dialog bg-surface p-6 text-on-surface shadow-3 backdrop:bg-scrim',
    // the browser keeps a modal dialog a little smaller than the viewport, which max-h-none and max-w-none undo. Nothing
    // is around it, so it has no corners and no shadow.
    fullscreen: 'm-0 size-full max-h-none max-w-none overflow-auto bg-surface p-4 text-on-surface backdrop:bg-scrim'
};

/**
 * A modal dialog on the native dialog element: `<ui-dialog #dialog>`, opened with dialog.open(). The browser
 * moves focus into it, keeps it there, closes it on escape and returns focus to where it was. A button in a
 * `<form method="dialog">` inside it closes it as well.
 * To open a component as a dialog from code, use the DialogService instead.
 * It is labelled by its first heading, unless it has a label.
 */
@Component({
    selector: 'ui-dialog',
    templateUrl: './dialog.component.html',
    host: {
        // the dialog is in the top layer while it is open and hidden otherwise, so the wrapper needs no box.
        class: 'contents'
    }
})
export class DialogComponent {
    private readonly dialog: Signal<ElementRef<HTMLDialogElement>> = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

    /**
     * The name screen readers announce, for a dialog without a heading. Not aria-label, which would stay on the
     * component's own element instead of the dialog.
     */
    readonly label: InputSignal<string | undefined> = input<string>();

    /**
     * Whether escape closes the dialog. Turn it off only for a dialog the user has to answer, like a question that
     * has no default. The dialog then needs a button that closes it.
     */
    readonly closeOnEscape: InputSignalWithTransform<boolean, unknown> = input(true, { transform: booleanAttribute });

    /**
     * How wide the dialog gets at most: md for a message or a question, lg for a form whose fields sit side by side,
     * fullscreen for content that takes the whole screen, like the pictures of a gallery.
     */
    readonly size: InputSignal<DialogSize> = input<DialogSize>('md');

    /**
     * Emits when the dialog closed, also when the browser closed it, like on escape.
     */
    readonly closed: OutputEmitterRef<void> = output();

    /**
     * The tailwind classes of the dialog.
     */
    protected readonly classes: Signal<string> = computed(() => DIALOG_SIZE_CLASSES[this.size()]);

    /**
     * The closedby attribute of the dialog: none while escape doesn't close it.
     */
    // closedby="none" keeps the browser from closing the dialog on escape, without the cancel event.
    protected readonly closedBy: Signal<'none' | undefined> = computed(() => this.closeOnEscape() ? undefined : 'none');

    /**
     * Keeps the dialog open on escape in browsers without closedby, while closeOnEscape is false.
     * @param event - The cancel event the browser fires before it closes the dialog on escape.
     */
    // browsers only let a page cancel this once per user interaction, so pressing escape twice in a row still closes
    // the dialog there. closed then emits like for any other way it closes.
    protected preventEscape(event: Event): void {
        if (!this.closeOnEscape()) {
            event.preventDefault();
        }
    }

    /**
     * Opens the dialog as a modal, above everything else, and makes the rest of the page inert.
     */
    // the native dialog also opens without being a modal with show(), which leaves the page usable and the focus where
    // it is. A dialog of this library is always a modal, so open() is enough of a name.
    open(): void {
        this.labelByFirstHeading();
        this.dialog().nativeElement.showModal();
    }

    /**
     * Closes the dialog.
     */
    close(): void {
        this.dialog().nativeElement.close();
    }

    // a dialog needs an accessible name, and its heading is what everyone sees as its name anyway.
    private labelByFirstHeading(): void {
        const element: HTMLDialogElement = this.dialog().nativeElement;
        if (this.label() != undefined || element.hasAttribute('aria-labelledby')) {
            return;
        }
        const heading: HTMLElement | null = element.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading == undefined) {
            return;
        }
        heading.id ||= `ui-dialog-heading-${nextHeadingId++}`;
        element.setAttribute('aria-labelledby', heading.id);
    }
}