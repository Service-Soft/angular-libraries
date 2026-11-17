/**
 * Utilities for testing dialogs in jsdom.
 */
export abstract class DialogTestingUtilities {
    /**
     * Lets dialogs open with showModal and close in jsdom, which has no modal dialogs: opening sets open, closing
     * removes it and fires close, like a browser does. Nothing else of a modal, like the inert page or the focus,
     * is there; test that in a real browser.
     * @returns A function that removes them again, to call after each test.
     */
    static addModalDialogs(): () => void {
        const showModal: HTMLDialogElement['showModal'] = HTMLDialogElement.prototype.showModal;
        const close: HTMLDialogElement['close'] = HTMLDialogElement.prototype.close;
        HTMLDialogElement.prototype.showModal = function(this: HTMLDialogElement): void {
            this.setAttribute('open', '');
        };
        HTMLDialogElement.prototype.close = function(this: HTMLDialogElement): void {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        };
        return () => {
            HTMLDialogElement.prototype.showModal = showModal;
            HTMLDialogElement.prototype.close = close;
        };
    }
}