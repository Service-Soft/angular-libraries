import { EnvironmentInjector, EnvironmentProviders, ErrorHandler, inject, makeEnvironmentProviders, provideBrowserGlobalErrorListeners, runInInjectionContext } from '@angular/core';

import { ErrorHandlerFn } from './error-handler-fn.type';

/**
 * Puts one ErrorHandler in place of the one of Angular that hands every error nothing caught to each of the given
 * handlers, in their order, like the interceptors of HttpClient: `provideErrorHandler(logErrorHandler(),
 * showDialogErrorHandler())`. Angular has only one ErrorHandler, so this is how several libraries handle the same error.
 * It does nothing with an error itself, so the console only shows it when a handler writes it there. An error of a
 * handler is written to the console, without stopping the handlers after it. Provide it in the application config, in
 * place of provideBrowserGlobalErrorListeners, which it brings, so a promise nothing awaits reaches the handlers too.
 * @param handlers - What to do with an error, each in an injection context.
 * @returns The providers of the ErrorHandler.
 */
export function provideErrorHandler(...handlers: ErrorHandlerFn[]): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideBrowserGlobalErrorListeners(),
        {
            provide: ErrorHandler,
            useFactory: (): ErrorHandler => {
                const injector: EnvironmentInjector = inject(EnvironmentInjector);
                return {
                    handleError: (error: unknown): void => {
                        for (const handler of handlers) {
                            try {
                                runInInjectionContext(injector, () => handler(error));
                            }
                            catch (handlerError) {
                                // logged rather than thrown: thrown, it would come back here, round and round
                                // eslint-disable-next-line no-console
                                console.error(handlerError);
                            }
                        }
                    }
                };
            }
        }
    ]);
}