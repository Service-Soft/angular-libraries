import { Component, ElementRef, inject } from '@angular/core';

// placed like the menu: a popover sits in the top layer, but the browser places it in the middle of the page and gives
// it a border and padding. inset-auto and the margins undo that, position-area puts it below its trigger, starting at
// its start edge, and the fallbacks flip it above or to the other side when it doesn't fit. Popovers sit on
// elevation 2. The area it is placed in ends at the edge of the screen, so its content wraps there instead of
// overflowing a narrow screen.
const POPOVER_CLASSES: string = `
    inset-auto mx-0 my-1 rounded-popover border border-outline-variant bg-surface p-4 text-on-surface shadow-2
    [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block,flip-inline]
`;

let nextId: number = 0;

/**
 * A panel on a native popover, like the options of a filter: `<ui-popover #filter>` with any content, opened by a
 * `<button [uiPopoverTrigger]="filter">`. Unlike a menu it stays open while the user works inside of it. The browser
 * opens and closes it, closes it on escape or a click outside, and tells screen readers whether it is open. Its
 * content follows the trigger in the tab order.
 */
@Component({
    selector: 'ui-popover',
    templateUrl: './popover.component.html',
    host: {
        class: POPOVER_CLASSES,
        popover: 'auto',
        '[id]': 'id',
        '[style.position-anchor]': 'anchorName'
    }
})
export class PopoverComponent {
    /**
     * The id of the popover, which its trigger points to.
     */
    readonly id: string = `ui-popover-${nextId++}`;

    /**
     * The name of the anchor the popover is placed at, which its trigger sets.
     */
    // always set: browsers disagree on whether a popover is placed at the button that opened it by default.
    readonly anchorName: string = `--${this.id}`;

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * Closes the popover. While focus is inside of it, the browser moves focus back to the trigger.
     */
    close(): void {
        this.element.hidePopover();
    }
}