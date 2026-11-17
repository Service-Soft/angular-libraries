import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponseBody, ValidationProblem } from 'zibri-contract';

/**
 * Utilities for the errors zibri answers requests with.
 */
export abstract class ErrorResponseUtilities {
    /**
     * Finds the error body of zibri in what a request failed with.
     * @param error - What the request failed with.
     * @returns The body, or undefined for an error that isn't one of zibri's, like without a connection.
     */
    static findErrorResponseBody(error: unknown): ErrorResponseBody | undefined {
        if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || error.error == undefined) {
            return undefined;
        }
        const body: object = error.error as object;
        const name: unknown = Reflect.get(body, 'name');
        const message: unknown = Reflect.get(body, 'message');
        const paragraphs: unknown = Reflect.get(body, 'paragraphs');
        if (typeof name !== 'string' || typeof message !== 'string' || !Array.isArray(paragraphs)) {
            return undefined;
        }
        const traceId: unknown = Reflect.get(body, 'traceId');
        return {
            status: error.status,
            name,
            message,
            paragraphs: paragraphs.filter((paragraph: unknown) => typeof paragraph === 'string'),
            problems: this.findProblems(Reflect.get(body, 'problems')),
            traceId: typeof traceId === 'string' ? traceId : undefined
        };
    }

    private static findProblems(problems: unknown): ValidationProblem[] | undefined {
        return Array.isArray(problems) ? problems.filter((problem: unknown) => this.isProblem(problem)) : undefined;
    }

    private static isProblem(problem: unknown): problem is ValidationProblem {
        return typeof problem === 'object'
            && problem != undefined
            && typeof Reflect.get(problem, 'key') === 'string'
            && typeof Reflect.get(problem, 'code') === 'string'
            && typeof Reflect.get(problem, 'message') === 'string';
    }
}