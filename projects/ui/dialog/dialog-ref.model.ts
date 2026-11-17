import { DialogComponent } from './dialog.component';

/**
 * A dialog opened with the DialogService. The component inside it injects it to close the dialog with a result.
 */
export class DialogRef<Result = unknown> {
    /**
     * Resolves with the result once the dialog closed, or with undefined when the user closed it without one, like
     * with escape.
     */
    readonly closed: Promise<Result | undefined>;

    private result: Result | undefined;

    constructor(private readonly dialog: DialogComponent) {
        this.closed = new Promise(resolve => {
            // the browser closes it as well, like on escape, so the closed output is the only place that sees every close.
            dialog.closed.subscribe(() => resolve(this.result));
        });
    }

    /**
     * Closes the dialog.
     * @param result - What closed resolves with.
     */
    close(result?: Result): void {
        this.result = result;
        this.dialog.close();
    }
}