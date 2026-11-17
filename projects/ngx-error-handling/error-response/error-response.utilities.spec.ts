import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, test } from 'vitest';

import { ErrorResponseUtilities } from './error-response.utilities';

describe('ErrorResponseUtilities', () => {
    test('reads the error body of zibri, with the problems of the values it refused', () => {
        const error: HttpErrorResponse = new HttpErrorResponse({
            status: 400,
            error: {
                status: 400,
                name: 'BadRequestError',
                message: 'Invalid data.',
                paragraphs: ['Invalid data.'],
                problems: [{ key: 'email', code: 'required', message: 'is required' }, { key: 'broken' }],
                traceId: 'trace-1'
            }
        });

        expect(ErrorResponseUtilities.findErrorResponseBody(error)).toEqual({
            status: 400,
            name: 'BadRequestError',
            message: 'Invalid data.',
            paragraphs: ['Invalid data.'],
            problems: [{ key: 'email', code: 'required', message: 'is required' }],
            traceId: 'trace-1'
        });
    });

    test('finds nothing in an error that isn\'t one of zibri', () => {
        expect(ErrorResponseUtilities.findErrorResponseBody(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }))).toBeUndefined();
        expect(ErrorResponseUtilities.findErrorResponseBody(new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }))).toBeUndefined();
        expect(ErrorResponseUtilities.findErrorResponseBody(new Error('A mistake of the app.'))).toBeUndefined();
    });
});