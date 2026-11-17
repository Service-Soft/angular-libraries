import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { EnvironmentProviders, ErrorHandler, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideErrorHandler } from '@service-soft/ngx-error-handling/error-handler';
import { afterEach, describe, expect, MockInstance, test, vi } from 'vitest';
import { LogLevel } from 'zibri-contract';

import { logErrorHandler } from './log-error-handler.function';
import { LoggerConfigChanges } from './logger-config-changes.model';
import { provideLoggerConfig } from './logger-config.provider';
import { LoggerService } from './logger.service';
import { NewLog } from './new-log.model';

const CONFIG: LoggerConfigChanges = { logUrl: '/api/logs', application: 'Website' };

function setUp(...providers: (Provider | EnvironmentProviders)[]): [LoggerService, HttpTestingController] {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ...providers] });
    return [TestBed.inject(LoggerService), TestBed.inject(HttpTestingController)];
}

describe('LoggerService', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        history.replaceState(undefined, '', '/');
    });

    test('writes every level to the console with its label in front of the message or the error, and the metadata', () => {
        const [logger] = setUp(provideLoggerConfig(CONFIG));
        const debug: MockInstance<Console['debug']> = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        const info: MockInstance<Console['info']> = vi.spyOn(console, 'info').mockImplementation(() => undefined);
        const error: MockInstance<Console['error']> = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failure: Error = new Error('Payment failed');

        logger.debug('Loaded');
        logger.info('Saved', { orderId: 1 });
        logger.critical(failure, { area: 'Checkout' });

        expect(debug).toHaveBeenCalledWith('%cDEBUG', expect.stringContaining('color'), 'Loaded');
        // the objects stay objects, so the console shows them as such
        expect(info).toHaveBeenCalledWith('%cINFO', expect.stringContaining('color'), 'Saved', { orderId: 1 });
        expect(error).toHaveBeenCalledWith('%cCRITICAL', expect.stringContaining('color'), failure, { area: 'Checkout' });
    });

    test('sends logs from info on, like a log of zibri, from the page it was logged on', () => {
        const [logger, http] = setUp(provideLoggerConfig(CONFIG));
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        history.replaceState(undefined, '', '/checkout?step=2');
        const cause: Error = new Error('No cart');
        const failure: Error = new TypeError('Cannot read total', { cause });

        logger.debug('Only in the console');
        logger.error(failure, { orderId: 1001 });

        const request: TestRequest = http.expectOne({ method: 'POST', url: '/api/logs' });
        const body: NewLog = {
            application: 'Website',
            level: LogLevel.ERROR,
            message: 'Cannot read total',
            context: {
                origin: '/checkout',
                metadata: { orderId: 1001 },
                error: {
                    name: 'TypeError',
                    paragraphs: ['Cannot read total', '    caused by Error:', '    No cart'],
                    stackTrace: [
                        ...failure.stack?.split('\n') ?? [],
                        '    caused by:',
                        ...cause.stack?.split('\n').map(line => `    ${line}`) ?? []
                    ]
                }
            }
        };
        expect(request.request.body).toEqual(body);
        http.verify();
    });

    test('logs from the configured levels on', () => {
        const [logger, http] = setUp(provideLoggerConfig({ ...CONFIG, minimumConsoleLevel: LogLevel.WARN, minimumSendLevel: LogLevel.DEBUG }));
        const info: MockInstance<Console['info']> = vi.spyOn(console, 'info').mockImplementation(() => undefined);
        const warn: MockInstance<Console['warn']> = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        logger.debug('Loaded');
        logger.info('Saved');
        logger.warn('Slow');

        expect(info).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(http.match({ method: 'POST', url: '/api/logs' }).map(request => (request.request.body as NewLog).level))
            .toEqual([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN]);
    });

    test('writes a log that couldn\'t be sent to the console, without sending that as well', async () => {
        const [logger, http] = setUp(provideLoggerConfig(CONFIG));
        vi.spyOn(console, 'info').mockImplementation(() => undefined);
        const error: MockInstance<Console['error']> = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        logger.info('Saved');
        http.expectOne('/api/logs').flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
        await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Sending a log failed:', expect.any(HttpErrorResponse)));
        http.verify();
    });

    test('says how to configure it when the config is missing', () => {
        expect(() => setUp()).toThrow('Add provideLoggerConfig({ logUrl, application }) to the providers of your app.');
    });
});

describe('logErrorHandler', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('logs the errors nothing caught to the console and the backend, but no failed requests', () => {
        const [, http] = setUp(provideLoggerConfig(CONFIG), provideErrorHandler(logErrorHandler()));
        const error: MockInstance<Console['error']> = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const handler: ErrorHandler = TestBed.inject(ErrorHandler);
        const notFound: HttpErrorResponse = new HttpErrorResponse({ status: 404, url: '/api/orders/1' });

        handler.handleError(new Error('Cannot read total'));
        handler.handleError(notFound);

        const request: TestRequest = http.expectOne('/api/logs');
        expect((request.request.body as NewLog).message).toBe('Cannot read total');
        expect(error).toHaveBeenCalledExactlyOnceWith('%cERROR', expect.stringContaining('color'), new Error('Cannot read total'));
        http.verify();
    });
});