import { Component, ElementRef, inject } from '@angular/core';

// a popover sits in the top layer, but the browser places it in the middle of the page and gives it a border and
// padding. inset-auto and the margins undo that, position-area puts it below its trigger, starting at its start edge,
// and the fallbacks flip it above or to the other side when it doesn't fit. Menus sit on elevation 2.
const MENU_CLASSES: string = `
    inset-auto mx-0 my-1 min-w-48 rounded-menu border border-outline-variant bg-surface px-0 py-1 text-on-surface shadow-2
    [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block,flip-inline]
`;

// beside the item that opens it, starting at its top, or on the other side when it doesn't fit. On a screen too narrow
// for either, below the item.
const SUBMENU_CLASSES: string = `
    inset-auto mx-0 my-0 min-w-48 rounded-menu border border-outline-variant bg-surface px-0 py-1 text-on-surface shadow-2
    [position-area:inline-end_span-block-end] [position-try-fallbacks:flip-inline,block-end_span-inline-end]
`;

let nextId: number = 0;

/**
 * A menu of actions and links, on a native popover: `<ui-menu #menu>` with `<ui-menu-item>` and `<a ui-menu-link>`
 * inside, opened by a `<button [uiMenuTrigger]="menu">`. The browser opens and closes it, closes it on escape or a
 * click outside, and tells screen readers whether it is open. Its items follow the trigger in the tab order.
 * A menu inside of a menu is a submenu, which a `<ui-menu-item [submenu]="submenu">` opens beside it.
 */
@Component({
    selector: 'ui-menu',
    templateUrl: './menu.component.html',
    host: {
        '[class]': 'classes',
        popover: 'auto',
        '[id]': 'id',
        '[style.position-anchor]': 'anchorName',
        '(toggle)': 'returnFocusToOpener($event)'
    }
})
export class MenuComponent {
    private readonly parent: MenuComponent | null = inject(MenuComponent, { skipSelf: true, optional: true });

    /**
     * The menu that isn't inside of another one, which closes every submenu with it.
     */
    readonly root: MenuComponent = this.parent?.root ?? this;

    /**
     * The classes of the menu, which depend on whether it is a submenu.
     */
    protected readonly classes: string = this.parent == undefined ? MENU_CLASSES : SUBMENU_CLASSES;

    /**
     * The id of the menu, which its trigger and items point to.
     */
    readonly id: string = `ui-menu-${nextId++}`;

    /**
     * The name of the anchor the menu is placed at, which its trigger sets.
     */
    // always set: browsers disagree on whether a popover is placed at the button that opened it by default.
    readonly anchorName: string = `--${this.id}`;

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * Closes the menu. While focus is inside of it, the browser moves focus back to the trigger.
     */
    close(): void {
        this.element.hidePopover();
    }

    /**
     * Gives the focus back to the item that opened a submenu, when the submenu closed with the focus inside of it.
     * @param event - The toggle event of the popover.
     */
    // Chromium only gives the focus back when a popover that is in no other popover closes, a submenu that closes on
    // escape drops it on the body. The event comes after the menu closed, while the hidden element inside may still
    // count as focused. Focus that moved somewhere else on purpose, like to the trigger of the root when that closed
    // every menu, stays where it is.
    protected returnFocusToOpener(event: ToggleEvent): void {
        const document: Document = this.element.ownerDocument;
        const focusIsLost: boolean = document.activeElement === document.body || this.element.contains(document.activeElement);
        if (this.parent == undefined || event.newState !== 'closed' || !focusIsLost) {
            return;
        }
        document.querySelector<HTMLElement>(`[popovertarget="${this.id}"]`)?.focus();
    }
}