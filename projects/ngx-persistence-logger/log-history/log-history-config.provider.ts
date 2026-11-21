import { inject, InjectionToken, Provider } from '@angular/core';
import { LogLevel } from 'zibri-contract';

import { LogHistoryConfigChanges } from './log-history-config-changes.model';
import { LogHistoryConfig } from './log-history-config.model';

/**
 * The values of the log history when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultLogHistoryConfig(): LogHistoryConfig {
    return {
        dateFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
        pageSize: 10,
        levels: [LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO],
        liveModeInterval: 1000,
        labels: {
            levels: {
                [LogLevel.CRITICAL]: $localize`:@@ngx-persistence-logger.log-history.levels.critical:Critical`,
                [LogLevel.ERROR]: $localize`:@@ngx-persistence-logger.log-history.levels.error:Error`,
                [LogLevel.WARN]: $localize`:@@ngx-persistence-logger.log-history.levels.warn:Warning`,
                [LogLevel.INFO]: $localize`:@@ngx-persistence-logger.log-history.levels.info:Info`,
                [LogLevel.DEBUG]: $localize`:@@ngx-persistence-logger.log-history.levels.debug:Debug`
            },
            levelFilter: $localize`:@@ngx-persistence-logger.log-history.levelFilter:Levels`,
            applications: $localize`:@@ngx-persistence-logger.log-history.applications:Applications`,
            allApplications: $localize`:@@ngx-persistence-logger.log-history.allApplications:All`,
            search: $localize`:@@ngx-persistence-logger.log-history.search:Search`,
            reload: $localize`:@@ngx-persistence-logger.log-history.reload:Reload`,
            liveMode: $localize`:@@ngx-persistence-logger.log-history.liveMode:Live mode`,
            stack: $localize`:@@ngx-persistence-logger.log-history.stack:Stack trace`,
            pages: $localize`:@@ngx-persistence-logger.log-history.pages:Pages of the logs`,
            noLogs: $localize`:@@ngx-persistence-logger.log-history.noLogs:No log matches the filters.`,
            loadingFailed: $localize`:@@ngx-persistence-logger.log-history.loadingFailed:The logs couldn't be loaded.`
        }
    };
}

/**
 * The values every log history below this injector uses. Change them with provideLogHistoryConfig.
 */
export const LOG_HISTORY_CONFIG: InjectionToken<LogHistoryConfig> = new InjectionToken<LogHistoryConfig>('LOG_HISTORY_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultLogHistoryConfig()
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
            const parent: LogHistoryConfig = inject(LOG_HISTORY_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultLogHistoryConfig();
            return {
                ...parent,
                ...config,
                labels: { ...parent.labels, ...config.labels, levels: { ...parent.labels.levels, ...config.labels?.levels } }
            };
        }
    };
}