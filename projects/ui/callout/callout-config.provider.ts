import { inject, InjectionToken, Provider } from '@angular/core';
import { faCircleCheck, faCircleExclamation, faCircleInfo, faLightbulb, faStar, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { CalloutConfig } from './callout-config.model';

/**
 * The values of a callout when nothing changes them. Its texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultCalloutConfig(): CalloutConfig {
    return {
        tone: 'info',
        icons: {
            neutral: faLightbulb,
            info: faCircleInfo,
            success: faCircleCheck,
            warning: faTriangleExclamation,
            error: faCircleExclamation,
            promo: faStar
        },
        toneLabels: {
            neutral: undefined,
            info: $localize`:@@ui.callout.toneLabels.info:Information`,
            success: $localize`:@@ui.callout.toneLabels.success:Success`,
            warning: $localize`:@@ui.callout.toneLabels.warning:Warning`,
            error: $localize`:@@ui.callout.toneLabels.error:Error`,
            promo: undefined
        }
    };
}

/**
 * The values every callout below this injector uses when its inputs are not set.
 * Change them with provideCalloutConfig.
 */
export const CALLOUT_CONFIG: InjectionToken<CalloutConfig> = new InjectionToken<CalloutConfig>('CALLOUT_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultCalloutConfig()
});

/**
 * Changes the values callouts use when their inputs are not set, like the icons and the texts screen readers read for
 * each tone.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for CALLOUT_CONFIG.
 */
export function provideCalloutConfig(config: Partial<CalloutConfig>): Provider {
    return {
        provide: CALLOUT_CONFIG,
        useFactory: (): CalloutConfig => ({
            ...inject(CALLOUT_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultCalloutConfig(),
            ...config
        })
    };
}