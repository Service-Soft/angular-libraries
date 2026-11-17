// the DialogService renders the dialog into the body, so the tests find it there.
import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideErrorHandler } from '@service-soft/ngx-error-handling/error-handler';
import { firstValueFrom } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, beforeEach, describe, expect, MockInstance, test, vi } from 'vitest';

import { ErrorDialogConfigChanges } from './error-dialog-config-changes.model';
import { showDialogErrorHandler } from './show-dialog-error-handler.function';

function setup(config?: ErrorDialogConfigChanges): ErrorHandler {
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting(), provideErrorHandler(showDialogErrorHandler(config))]
    });
    return TestBed.inject(ErrorHandler);
}

// the dialog, as the user reads it: its heading and its paragraphs.
async function findDialog(): Promise<string[]> {
    await TestBed.inject(ApplicationRef).whenStable();
    const dialog: HTMLDialogElement | null = document.querySelector('dialog');
    return dialog == undefined ? [] : [...dialog.querySelectorAll('h2, p')].map(element => element.textContent.trim());
}

function refuse(status: number, body: object): HttpErrorResponse {
    return new HttpErrorResponse({ status, error: { status, message: 'Refused', paragraphs: ['Refused.'], ...body } });
}

describe('showDialogErrorHandler', () => {
    let removeModalDialogs: () => void;
    let logged: MockInstance<(...data: unknown[]) => void>;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();

        logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        removeModalDialogs();
        for (const element of document.querySelectorAll('ui-dialog')) {
            element.remove();
        }
        vi.restoreAllMocks();
    });

    test('shows a request nothing caught with the message of zibri, its problems and its reference, writing nothing to the console', async () => {
        const errorHandler: ErrorHandler = setup();
        const http: HttpClient = TestBed.inject(HttpClient);

        // a request whose error nothing handles reaches the ErrorHandler, as the global listeners hand it on
        const failed: Promise<void> = (async () => {
            try {
                await firstValueFrom(http.post('/api/users', {}));
            }
            catch (error) {
                errorHandler.handleError(error);
            }
        })();
        TestBed.inject(HttpTestingController)
            .expectOne('/api/users')
            .flush(
                {
                    status: 400,
                    name: 'BadRequestError',
                    message: 'Invalid data.',
                    paragraphs: ['Invalid data.'],
                    problems: [{ key: 'email', code: 'required', message: 'is required' }],
                    traceId: 'trace-1'
                },
                { status: 400, statusText: 'Bad Request' }
            );
        await failed;

        expect(await findDialog()).toEqual(['That didn\'t work', 'Invalid data.', 'email: is required', 'Reference: trace-1']);
        expect(logged).not.toHaveBeenCalled();
    });

    test('says when a request found no connection, and that something went wrong for any other error', async () => {
        const errorHandler: ErrorHandler = setup();

        errorHandler.handleError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
        expect(await findDialog()).toEqual(['No connection', 'Check your connection and try again.']);
        FormTestingUtilities.click(document.querySelector('dialog') ?? document.body, 'OK');
        await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull());

        errorHandler.handleError(new TypeError('A mistake of the app.'));
        expect(await findDialog()).toEqual(['Something went wrong', 'Something went wrong. Please try again later.']);
    });

    test('shows one dialog at a time, and none for an ignored error', async () => {
        const errorHandler: ErrorHandler = setup({ isIgnored: error => error instanceof RangeError });

        errorHandler.handleError(refuse(401, { name: 'UnauthorizedError' }));
        errorHandler.handleError(new RangeError('Handled by the app.'));
        expect(await findDialog()).toEqual([]);

        errorHandler.handleError(refuse(500, { name: 'InternalServerError', paragraphs: ['The server failed.'] }));
        errorHandler.handleError(refuse(503, { name: 'ServiceUnavailableError' }));
        expect(await findDialog()).toEqual(['Something went wrong', 'The server failed.']);
        expect(document.querySelectorAll('dialog')).toHaveLength(1);
    });
});