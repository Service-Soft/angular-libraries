import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LogLevel } from 'zibri-contract';

import { LoggedErrorUtilities } from './logged-error.utilities';
import { LoggerConfig } from './logger-config.model';
import { LOGGER_CONFIG } from './logger-config.provider';
import { NewLog } from './new-log.model';

// looked up when logging instead of bound once, so whatever replaced the console by then, like a test, gets the logs.
const CONSOLE_METHODS: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
    [LogLevel.CRITICAL]: 'error'
};

const CONSOLE_LABELS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.CRITICAL]: 'CRITICAL'
};

// the console applies them to the text after %c. They show on the light and the dark background of the devtools.
const CONSOLE_STYLES: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'color: #4cbb17; font-weight: bold',
    [LogLevel.INFO]: 'color: #00bfff; font-weight: bold',
    [LogLevel.WARN]: 'color: orange; font-weight: bold',
    [LogLevel.ERROR]: 'color: red; font-weight: bold',
    [LogLevel.CRITICAL]: 'color: white; background-color: purple; font-weight: bold; padding: 0 4px'
};

/**
 * What a log is made of before it is written and sent.
 */
type LogEntry = {
    /**
     * How important it is.
     */
    level: LogLevel,
    /**
     * What was logged, or the message of the error.
     */
    message: string,
    /**
     * What else was logged with it.
     */
    metadata?: Record<string, unknown>,
    /**
     * Whether the error of an error or critical log was thrown, which it has even when it is undefined.
     */
    hasError: boolean,
    /**
     * What was thrown.
     */
    error?: unknown
};

/**
 * Logs to the console of the browser and sends the logs to a backend, each from the level set with
 * provideLoggerConfig on, with the same methods as the logger of zibri. Inject it, or extend it to change how logs are
 * sent and provide your class instead.
 */
@Service()
export class LoggerService {
    /**
     * Sends the logs in sendLog.
     */
    protected readonly http: HttpClient = inject(HttpClient);

    /**
     * Where and from which level on it logs.
     */
    protected readonly config: LoggerConfig = inject(LOGGER_CONFIG);

    private readonly document: Document = inject(DOCUMENT);

    /**
     * Logs details that only help while looking for a bug. They are only sent when the minimum send level is debug.
     * @param message - What happened.
     * @param metadata - What else to log, like the objects it is about.
     */
    debug(message: string, metadata?: Record<string, unknown>): void {
        this.log({ level: LogLevel.DEBUG, message, metadata, hasError: false });
    }

    /**
     * Logs what the application is doing.
     * @param message - What happened.
     * @param metadata - What else to log, like the objects it is about.
     */
    info(message: string, metadata?: Record<string, unknown>): void {
        this.log({ level: LogLevel.INFO, message, metadata, hasError: false });
    }

    /**
     * Logs a state that might lead to errors.
     * @param message - What happened.
     * @param metadata - What else to log, like the objects it is about.
     */
    warn(message: string, metadata?: Record<string, unknown>): void {
        this.log({ level: LogLevel.WARN, message, metadata, hasError: false });
    }

    /**
     * Logs something that doesn't work as intended, with the message of the error.
     * @param error - What went wrong, usually an Error, like the one a catch got.
     * @param metadata - What else to log, like the objects it is about.
     */
    error(error: unknown, metadata?: Record<string, unknown>): void {
        this.log(this.resolveErrorEntry(LogLevel.ERROR, error, metadata));
    }

    /**
     * Logs something that needs to be fixed right away, with the message of the error.
     * @param error - What went wrong, usually an Error, like the one a catch got.
     * @param metadata - What else to log, like the objects it is about.
     */
    critical(error: unknown, metadata?: Record<string, unknown>): void {
        this.log(this.resolveErrorEntry(LogLevel.CRITICAL, error, metadata));
    }

    /**
     * Sends a log to the backend. By default it sends a POST request with the log as its body to the logUrl of the
     * config. Override it to send logs somewhere else. When it throws, the error is only written to the console.
     * @param log - The log to send.
     */
    protected async sendLog(log: NewLog): Promise<void> {
        await firstValueFrom(this.http.post(this.config.logUrl, log));
    }

    private resolveErrorEntry(level: LogLevel, error: unknown, metadata: Record<string, unknown> | undefined): LogEntry {
        return { level, message: LoggedErrorUtilities.resolveMessage(error), metadata, hasError: true, error };
    }

    private log(entry: LogEntry): void {
        if (entry.level >= this.config.minimumConsoleLevel) {
            // the error takes the place of its message, so the console shows it with its stack, and the metadata stays
            // an object to expand. The devtools link the log to the line that called this service, not to this one:
            // angular marks packages from node_modules in the source maps of development builds as code to skip.
            // eslint-disable-next-line no-console
            console[CONSOLE_METHODS[entry.level]](
                `%c${CONSOLE_LABELS[entry.level]}`,
                CONSOLE_STYLES[entry.level],
                entry.hasError ? entry.error : entry.message,
                ...entry.metadata == undefined ? [] : [entry.metadata]
            );
        }
        if (entry.level >= this.config.minimumSendLevel) {
            void this.trySendLog({
                application: this.config.application,
                level: entry.level,
                message: entry.message,
                context: {
                    // the bundle of a browser has no files to name, so the page says where in the application it was
                    origin: this.document.location.pathname,
                    metadata: entry.metadata,
                    error: entry.hasError ? LoggedErrorUtilities.resolveLoggedError(entry.error) : undefined
                }
            });
        }
    }

    private async trySendLog(log: NewLog): Promise<void> {
        try {
            await this.sendLog(log);
        }
        catch (error) {
            // only to the console: sending this would fail the same way, and could go on forever.
            // eslint-disable-next-line no-console
            console.error('Sending a log failed:', error);
        }
    }
}