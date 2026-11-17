import { HttpErrorResponse } from '@angular/common/http';

import { AuthErrorBody } from './auth-error-body.model';

/**
 * Utilities for the errors zibri answers auth requests with.
 */
export abstract class AuthErrorUtilities {
    /**
     * Finds what the auth reads of the body of a failed request.
     * @param error - What the request failed with.
     * @returns The name, ticket and methods of the body, or undefined for an error that isn't one of zibri's.
     */
    static findErrorBody(error: unknown): AuthErrorBody | undefined {
        if (!(error instanceof HttpErrorResponse)) {
            return undefined;
        }
        const body: unknown = error.error;
        if (typeof body !== 'object' || body == undefined) {
            return undefined;
        }
        const name: unknown = Reflect.get(body, 'name');
        const ticket: unknown = Reflect.get(body, 'ticket');
        const methods: unknown = Reflect.get(body, 'methods');
        const paragraphs: unknown = Reflect.get(body, 'paragraphs');
        if (typeof name !== 'string') {
            return undefined;
        }
        return {
            name,
            ticket: typeof ticket === 'string' ? ticket : undefined,
            methods: Array.isArray(methods) ? methods.filter((method: unknown) => typeof method === 'string') : undefined,
            paragraphs: Array.isArray(paragraphs) ? paragraphs.filter((paragraph: unknown) => typeof paragraph === 'string') : undefined
        };
    }

    /**
     * Finds the name of the error zibri answered a request with, like 'SecondFactorMissingError'.
     * @param error - What the request failed with.
     * @returns The name, or undefined for an error that isn't one of zibri's.
     */
    static findErrorName(error: unknown): string | undefined {
        return this.findErrorBody(error)?.name;
    }

    /**
     * Finds the message zibri answered a request with, in the paragraphs it was written as and in the language of the
     * request, like a wrong password or too many attempts.
     * @param error - What the request failed with.
     * @returns The paragraphs, or undefined for an error that isn't one of zibri's.
     */
    static findErrorParagraphs(error: unknown): string[] | undefined {
        const paragraphs: string[] | undefined = this.findErrorBody(error)?.paragraphs;
        return paragraphs?.length ? paragraphs : undefined;
    }
}