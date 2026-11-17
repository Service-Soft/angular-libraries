// what marks an open popover, as jsdom has no :popover-open.
const OPEN_ATTRIBUTE: string = 'data-popover-open';

/**
 * Utilities for testing popovers in jsdom.
 */
export abstract class PopoverTestingUtilities {
    /**
     * Lets popovers open and close from code in jsdom, which has no popover api: showPopover, hidePopover and
     * togglePopover set and remove a `data-popover-open` attribute, which tests can check. An open popover is shown, so
     * what is inside of it can take focus. Nothing else of a popover, like the top layer or light dismiss, is there; test
     * that in a real browser. Apis jsdom has are left as they are.
     * @returns A function that removes them again.
     */
    static addPopovers(): () => void {
        const prototype: HTMLElement = HTMLElement.prototype;
        if ('showPopover' in prototype) {
            return () => undefined;
        }
        // the stylesheet of jsdom hides every popover that isn't :popover-open, which it never is, and nothing hidden
        // can be focused. Without important, the computed style of jsdom kept its own rule.
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = `[popover][${OPEN_ATTRIBUTE}] { display: block !important; }`;
        document.head.append(style);
        Object.defineProperties(prototype, {
            showPopover: {
                configurable: true,
                value: function(this: HTMLElement): void {
                    this.setAttribute(OPEN_ATTRIBUTE, '');
                }
            },
            hidePopover: {
                configurable: true,
                value: function(this: HTMLElement): void {
                    this.removeAttribute(OPEN_ATTRIBUTE);
                }
            },
            togglePopover: {
                configurable: true,
                value: function(this: HTMLElement, force?: boolean): boolean {
                    const open: boolean = force ?? !this.hasAttribute(OPEN_ATTRIBUTE);
                    this.toggleAttribute(OPEN_ATTRIBUTE, open);
                    return open;
                }
            }
        });
        return () => {
            style.remove();
            for (const name of ['showPopover', 'hidePopover', 'togglePopover']) {
                Reflect.deleteProperty(prototype, name);
            }
        };
    }
}