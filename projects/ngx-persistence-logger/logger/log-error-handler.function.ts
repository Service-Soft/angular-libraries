import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { LoggerService } from './logger.service';

/**
 * Logs every error that nothing caught with the error method of the LoggerService, which writes it to the console and
 * sends it to the backend, for provideErrorHandler of ngx-error-handling:
 * `provideErrorHandler(logErrorHandler(), showDialogErrorHandler())`. Failed requests aren't logged, the backend that
 * answered them logs them itself.
 * @returns The handler, for provideErrorHandler.
 */
export function logErrorHandler(): (error: unknown) => void {
    // the type of the handlers of provideErrorHandler, written out, so the logger works without ngx-error-handling.
    return error => {
        if (error instanceof HttpErrorResponse) {
            return;
        }
        inject(LoggerService).error(error);
    };
}