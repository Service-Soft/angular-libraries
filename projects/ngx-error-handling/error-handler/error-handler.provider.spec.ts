import { ErrorHandler, inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, MockInstance, test, vi } from 'vitest';

import { ErrorHandlerFn } from './error-handler-fn.type';
import { provideErrorHandler } from './error-handler.provider';

const SEEN: InjectionToken<unknown[]> = new InjectionToken<unknown[]>('SEEN', { providedIn: 'root', factory: () => [] });

// remembers every error it gets in SEEN, which it injects, with its name in front.
function remember(name: string): ErrorHandlerFn {
    return error => {
        inject(SEEN).push(`${name}: ${String(error)}`);
    };
}

describe('provideErrorHandler', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('only hands an error to each handler in order, in an injection context', () => {
        const logged: MockInstance<Console['error']> = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        TestBed.configureTestingModule({ providers: [provideErrorHandler(remember('first'), remember('second'))] });

        TestBed.inject(ErrorHandler).handleError(new Error('Failed'));

        expect(TestBed.inject(SEEN)).toEqual(['first: Error: Failed', 'second: Error: Failed']);
        expect(logged).not.toHaveBeenCalled();
    });

    test('writes an error of a handler to the console, and still runs the handlers after it', () => {
        const logged: MockInstance<Console['error']> = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failing: ErrorHandlerFn = () => {
            throw new Error('The handler failed');
        };
        TestBed.configureTestingModule({ providers: [provideErrorHandler(failing, remember('after'))] });

        TestBed.inject(ErrorHandler).handleError('Failed');

        expect(TestBed.inject(SEEN)).toEqual(['after: Failed']);
        expect(logged).toHaveBeenCalledExactlyOnceWith(new Error('The handler failed'));
    });
});