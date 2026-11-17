import { LoggedError } from 'zibri-contract';

// what an error of a cause is indented by, like zibri does.
const CAUSE_INDENT: string = '    ';

/**
 * An error, or anything that looks like one, like an HttpErrorResponse, which is no instance of Error.
 */
type ErrorLike = {
    /**
     * The name of the error.
     */
    name: string,
    /**
     * What went wrong.
     */
    message: string,
    /**
     * Where it went wrong.
     */
    stack?: string,
    /**
     * What caused it.
     */
    cause?: unknown,
    /**
     * What went wrong, a line each, like errors of zibri have them.
     */
    paragraphs?: unknown
};

/**
 * Turns what was thrown into the error of a log, like zibri does.
 */
export abstract class LoggedErrorUtilities {
    /**
     * Resolves the error of a log from what was thrown: its name, its message and the ones of its causes as paragraphs,
     * and its stack and the ones of its causes as the stack trace.
     * @param error - What was thrown, usually an Error, like the one a catch got.
     * @returns The error of the log.
     */
    static resolveLoggedError(error: unknown): LoggedError {
        if (!LoggedErrorUtilities.isErrorLike(error)) {
            return { name: 'Error', paragraphs: [LoggedErrorUtilities.resolveMessage(error)], stackTrace: [] };
        }
        return {
            name: error.name,
            paragraphs: LoggedErrorUtilities.resolveParagraphs(error, ''),
            stackTrace: LoggedErrorUtilities.resolveStackTrace(error, '')
        };
    }

    /**
     * Resolves the message of a log of what was thrown: the message of an error, a string as it is, and anything else
     * as json.
     * @param error - What was thrown.
     * @returns The message.
     */
    static resolveMessage(error: unknown): string {
        if (LoggedErrorUtilities.isErrorLike(error)) {
            return error.message;
        }
        return typeof error === 'string' ? error : JSON.stringify(error) ?? String(error);
    }

    // the stacks of the causes as well, like zibri: the stack of an error never names its cause.
    private static resolveStackTrace(error: ErrorLike, indent: string): string[] {
        const stackTrace: string[] = error.stack?.split('\n').map(line => `${indent}${line}`) ?? [];
        if (!LoggedErrorUtilities.isErrorLike(error.cause) || !error.cause.stack) {
            return stackTrace;
        }
        const causeIndent: string = indent + CAUSE_INDENT;
        return [...stackTrace, `${causeIndent}caused by:`, ...LoggedErrorUtilities.resolveStackTrace(error.cause, causeIndent)];
    }

    private static resolveParagraphs(error: ErrorLike, indent: string): string[] {
        const own: string[] = Array.isArray(error.paragraphs) && error.paragraphs.every(paragraph => typeof paragraph === 'string')
            ? error.paragraphs
            : error.message.split('\n');
        const paragraphs: string[] = own.map(paragraph => `${indent}${paragraph}`);
        if (error.cause == undefined) {
            return paragraphs;
        }
        const causeIndent: string = indent + CAUSE_INDENT;
        if (LoggedErrorUtilities.isErrorLike(error.cause)) {
            return [
                ...paragraphs,
                `${causeIndent}caused by ${error.cause.name}:`,
                ...LoggedErrorUtilities.resolveParagraphs(error.cause, causeIndent)
            ];
        }
        return [...paragraphs, `${causeIndent}caused by:`, ...JSON.stringify(error.cause, undefined, 2).split('\n')];
    }

    private static isErrorLike(error: unknown): error is ErrorLike {
        return typeof error === 'object'
            && error != undefined
            && 'name' in error
            && typeof error.name === 'string'
            && 'message' in error
            && typeof error.message === 'string';
    }
}