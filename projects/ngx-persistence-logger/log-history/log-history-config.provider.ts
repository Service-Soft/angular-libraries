import { inject, InjectionToken, Provider } from '@angular/core';
import { LogLevel } from 'zibri-contract';

import { LogHistoryConfigChanges } from './log-history-config-changes.model';
import { LogHistoryConfig } from './log-history-config.model';

const DEFAULT_LOG_HISTORY_CONFIG: LogHistoryConfig = {
    dateFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
    pageSize: 10,
    levels: [LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO],
    liveModeInterval: 1000,
    labels: {
        levels: {
            [LogLevel.CRITICAL]: 'Critical',
            [LogLevel.ERROR]: 'Error',
            [LogLevel.WARN]: 'Warning',
            [LogLevel.INFO]: 'Info',
            [LogLevel.DEBUG]: 'Debug'
        },
        levelFilter: 'Levels',
        applications: 'Applications',
        allApplications: 'All',
        search: 'Search',
        reload: 'Reload',
        liveMode: 'Live mode',
        stack: 'Stack trace',
        pages: 'Pages of the logs',
        noLogs: 'No log matches the filters.',
        loadingFailed: 'The logs couldn\'t be loaded.'
    }
};

/**
 * The values every log history below this injector uses. Change them with provideLogHistoryConfig.
 */
export const LOG_HISTORY_CONFIG: InjectionToken<LogHistoryConfig> = new InjectionToken<LogHistoryConfig>('LOG_HISTORY_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_LOG_HISTORY_CONFIG
});

/**
 * Changes the values the log history uses, like the labels to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for LOG_HISTORY_CONFIG.
 */
export function provideLogHistoryConfig(config: LogHistoryConfigChanges): Provider {
    return {
        provide: LOG_HISTORY_CONFIG,
        useFactory: (): LogHistoryConfig => {
            const parent: LogHistoryConfig = inject(LOG_HISTORY_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_LOG_HISTORY_CONFIG;
            return {
                ...parent,
                ...config,
                labels: { ...parent.labels, ...config.labels, levels: { ...parent.labels.levels, ...config.labels?.levels } }
            };
        }
    };
}