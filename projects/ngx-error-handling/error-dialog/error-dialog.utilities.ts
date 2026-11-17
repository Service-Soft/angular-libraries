import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ErrorResponseUtilities } from '@service-soft/ngx-error-handling/error-response';
import { MessageDialogData } from '@service-soft/ui/dialog';
import { ErrorResponseBody } from 'zibri-contract';

import { ErrorDialogConfigChanges } from './error-dialog-config-changes.model';
import { ErrorDialogConfig } from './error-dialog-config.model';

// the status of a request that reached no server.
const NO_CONNECTION: number = 0;

// the first status of the errors of the server, after the refusals of the request.
const FIRST_SERVER_ERROR: number = 500;

const DEFAULT_ERROR_DIALOG_CONFIG: ErrorDialogConfig = {
    labels: {
        refusedTitle: 'That didn\'t work',
        failedTitle: 'Something went wrong',
        offlineTitle: 'No connection',
        failedParagraphs: ['Something went wrong. Please try again later.'],
        offlineParagraphs: ['Check your connection and try again.'],
        problem: (key, message) => `${key}: ${message}`,
        reference: traceId => `Reference: ${traceId}`,
        close: 'OK'
    },
    // the auth ends a login zibri refuses, and sends the user to the login
    ignoredStatuses: [HttpStatusCode.Unauthorized],
    isIgnored: () => false
};

/**
 * Utilities for the dialog that shows an error.
 */
export abstract class ErrorDialogUtilities {
    /**
     * Resolves the config of the error dialog from what changes it.
     * @param changes - The values to change. Values you leave out keep their defaults, including single labels.
     * @returns The config.
     */
    static resolveConfig(changes: ErrorDialogConfigChanges): ErrorDialogConfig {
        return {
            ...DEFAULT_ERROR_DIALOG_CONFIG,
            ...changes,
            labels: { ...DEFAULT_ERROR_DIALOG_CONFIG.labels, ...changes.labels }
        };
    }

    /**
     * Whether an error shows no dialog: one of the ignoredStatuses, or one isIgnored says so of.
     * @param error - The error.
     * @param config - Which errors the dialog shows.
     * @returns Whether it shows none.
     */
    static isIgnored(error: unknown, config: ErrorDialogConfig): boolean {
        return (error instanceof HttpErrorResponse && config.ignoredStatuses.includes(error.status)) || config.isIgnored(error);
    }

    /**
     * Resolves what the dialog says about an error: the message of zibri, in the language of the request, with the
     * problems of the values it refused and the reference of the request, or a text of the config for an error that
     * says nothing a user understands.
     * @param error - The error.
     * @param config - How the dialog shows it.
     * @returns The data of the dialog.
     */
    static resolveDialogData(error: unknown, config: ErrorDialogConfig): MessageDialogData {
        const labels: ErrorDialogConfig['labels'] = config.labels;
        if (error instanceof HttpErrorResponse && error.status === NO_CONNECTION) {
            return { title: labels.offlineTitle, paragraphs: labels.offlineParagraphs, closeButtonLabel: labels.close };
        }
        const body: ErrorResponseBody | undefined = ErrorResponseUtilities.findErrorResponseBody(error);
        if (!body?.paragraphs.length) {
            return { title: labels.failedTitle, paragraphs: labels.failedParagraphs, closeButtonLabel: labels.close };
        }
        return {
            title: body.status < FIRST_SERVER_ERROR ? labels.refusedTitle : labels.failedTitle,
            paragraphs: [
                ...body.paragraphs,
                ...(body.problems ?? []).map(problem => labels.problem(problem.key, problem.message)),
                ...body.traceId == undefined ? [] : [labels.reference(body.traceId)]
            ],
            closeButtonLabel: labels.close
        };
    }
}