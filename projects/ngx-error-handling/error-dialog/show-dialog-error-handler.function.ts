import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { ErrorHandlerFn } from '@service-soft/ngx-error-handling/error-handler';
import { DialogService, MessageDialogComponent } from '@service-soft/ui/dialog';

import { ErrorDialogConfigChanges } from './error-dialog-config-changes.model';
import { ErrorDialogConfig } from './error-dialog-config.model';
import { ErrorDialogUtilities } from './error-dialog.utilities';

/**
 * Shows every error that nothing caught in a dialog, for provideErrorHandler: a request zibri refused or that found no
 * connection, with the message of zibri, in the language of the request, the problems of the values it refused and
 * the reference of the request. Errors your code catches, like the ones a form shows itself, show none. One dialog
 * shows at a time, and none on the server.
 * @param changes - The values to change, like the texts to translate them.
 * @returns The handler, for provideErrorHandler.
 */
export function showDialogErrorHandler(changes: ErrorDialogConfigChanges = {}): ErrorHandlerFn {
    // an error that follows another, like every request of a page without a connection, would stack dialogs. The
    // handler belongs to the app config it is provided in, so this is one flag per app.
    let showing: boolean = false;

    /**
     * Shows the dialog of an error until the user closes it.
     * @param dialogService - Opens the dialog.
     * @param error - The error to show.
     * @param config - How the dialog shows it.
     */
    async function showDialog(dialogService: DialogService, error: unknown, config: ErrorDialogConfig): Promise<void> {
        // set before the first await, so an error right after this one finds it showing
        showing = true;
        try {
            await dialogService.open(MessageDialogComponent, ErrorDialogUtilities.resolveDialogData(error, config)).closed;
        }
        catch (dialogError) {
            // logged rather than thrown: an error of the dialog itself would come back here, round and round
            // eslint-disable-next-line no-console
            console.error(dialogError);
        }
        finally {
            showing = false;
        }
    }

    return error => {
        if (!isPlatformBrowser(inject(PLATFORM_ID)) || showing) {
            return;
        }
        // resolved for each error rather than once above: showDialogErrorHandler runs when the app config is created,
        // which can be before the translations an app loads at runtime, and its default texts are $localize.
        const config: ErrorDialogConfig = ErrorDialogUtilities.resolveConfig(changes);
        if (ErrorDialogUtilities.isIgnored(error, config)) {
            return;
        }
        // injected here, as inject() only works until the first await
        void showDialog(inject(DialogService), error, config);
    };
}