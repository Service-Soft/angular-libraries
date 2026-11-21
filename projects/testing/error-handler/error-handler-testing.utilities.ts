import { ErrorHandler, Provider } from '@angular/core';

/**
 * Utilities for testing errors that an app reports to its error handler.
 */
export abstract class ErrorHandlerTestingUtilities {
    /**
     * Provides an error handler that adds every error the app reports to a list, in place of the default one of
     * Angular, which logs them. A test that expects an error then logs nothing and can check what was reported.
     * In a test, errors of change detection also still make fixture.whenStable() fail.
     * @param errors - The list the errors are added to.
     * @returns The provider, for the providers of TestBed.configureTestingModule.
     */
    static provideErrorList(errors: unknown[]): Provider {
        const errorHandler: ErrorHandler = { handleError: (error: unknown) => errors.push(error) };
        return { provide: ErrorHandler, useValue: errorHandler };
    }
}