import { InjectionToken, Provider } from '@angular/core';
import { LogLevel } from 'zibri-contract';

import { LoggerConfigChanges } from './logger-config-changes.model';
import { LoggerConfig } from './logger-config.model';

/**
 * Where and from which level on the LoggerService logs. Set it with provideLoggerConfig.
 */
export const LOGGER_CONFIG: InjectionToken<LoggerConfig> = new InjectionToken<LoggerConfig>('LOGGER_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The LoggerService needs to know where to send the logs. '
            + 'Add provideLoggerConfig({ logUrl, application }) to the providers of your app.');
    }
});

/**
 * Sets where the LoggerService sends the logs, the application they come from, and from which level on it logs.
 * Provide it in the application config: there is one LoggerService for the whole app.
 * @param config - The url, the application and the levels to change.
 * @returns The provider for LOGGER_CONFIG.
 */
export function provideLoggerConfig(config: LoggerConfigChanges): Provider {
    // no merging with a parent injector like other configs: the service lives in the root injector, so it never sees a
    // config provided further down.
    const loggerConfig: LoggerConfig = { minimumConsoleLevel: LogLevel.DEBUG, minimumSendLevel: LogLevel.INFO, ...config };
    return { provide: LOGGER_CONFIG, useValue: loggerConfig };
}