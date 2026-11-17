import { describe, expect, test } from 'vitest';

import { LoggedErrorUtilities } from './logged-error.utilities';

describe('LoggedErrorUtilities', () => {
    test('takes the paragraphs of an error of zibri, and turns a cause that is no error into json', () => {
        const refused: Error = Object.assign(new Error('Refused', { cause: { orderId: 1 } }), { paragraphs: ['Refused.', 'Try again.'] });

        expect(LoggedErrorUtilities.resolveLoggedError(refused).paragraphs).toEqual([
            'Refused.',
            'Try again.',
            '    caused by:',
            '{',
            '  "orderId": 1',
            '}'
        ]);
    });

    test('keeps the stacks of the error and its cause in the stack trace only, like zibri', () => {
        const cause: Error = new Error('Timed out');
        const failure: Error = new Error('Saving failed', { cause });

        expect(LoggedErrorUtilities.resolveLoggedError(failure)).toEqual({
            name: 'Error',
            paragraphs: ['Saving failed', '    caused by Error:', '    Timed out'],
            stackTrace: [
                ...failure.stack?.split('\n') ?? [],
                '    caused by:',
                ...cause.stack?.split('\n').map(line => `    ${line}`) ?? []
            ]
        });
    });

    test('logs what was thrown that is no error as its message, without a stack', () => {
        expect(LoggedErrorUtilities.resolveLoggedError('Failed')).toEqual({ name: 'Error', paragraphs: ['Failed'], stackTrace: [] });
        expect(LoggedErrorUtilities.resolveMessage({ code: 42 })).toBe('{"code":42}');
        expect(LoggedErrorUtilities.resolveMessage(undefined)).toBe('undefined');
    });
});