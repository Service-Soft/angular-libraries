import { inject, InjectionToken, Provider } from '@angular/core';
import { faCheck, faExclamation, faInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { ResultConfigChanges } from './result-config-changes.model';
import { ResultConfig } from './result-config.model';

const DEFAULT_RESULT_CONFIG: ResultConfig = {
    tone: 'neutral',
    headingLevel: 1,
    icons: {
        success: faCheck,
        info: faInfo,
        warning: faExclamation,
        error: faXmark,
        neutral: faInfo
    }
};

/**
 * The values every result page below this injector uses when its inputs are not set.
 * Change them with provideResultConfig.
 */
export const RESULT_CONFIG: InjectionToken<ResultConfig> = new InjectionToken<ResultConfig>('RESULT_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_RESULT_CONFIG
});

/**
 * Changes the values result pages use when their inputs are not set, like the icon of a tone.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, also the icons of single tones.
 * @param config - The values to change.
 * @returns The provider for RESULT_CONFIG.
 */
export function provideResultConfig(config: ResultConfigChanges): Provider {
    return {
        provide: RESULT_CONFIG,
        useFactory: (): ResultConfig => {
            const parent: ResultConfig = inject(RESULT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_RESULT_CONFIG;
            return { ...parent, ...config, icons: { ...parent.icons, ...config.icons } };
        }
    };
}