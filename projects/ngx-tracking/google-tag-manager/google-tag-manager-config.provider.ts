import { InjectionToken, Provider } from '@angular/core';

import { GoogleTagManagerConfig } from './google-tag-manager-config.model';

/**
 * The container the GoogleTagManagerService loads. Set it with provideGoogleTagManager.
 */
export const GOOGLE_TAG_MANAGER_CONFIG: InjectionToken<GoogleTagManagerConfig> = new InjectionToken<GoogleTagManagerConfig>(
    'GOOGLE_TAG_MANAGER_CONFIG',
    {
        providedIn: 'root',
        factory: () => {
            throw new Error('The GoogleTagManagerService needs a container id. '
                + 'Add provideGoogleTagManager({ containerId }) to the providers of your app.');
        }
    }
);

/**
 * Sets the container the GoogleTagManagerService loads. Provide it in the application config.
 * @param config - The container id.
 * @returns The provider for GOOGLE_TAG_MANAGER_CONFIG.
 */
export function provideGoogleTagManager(config: GoogleTagManagerConfig): Provider {
    return { provide: GOOGLE_TAG_MANAGER_CONFIG, useValue: config };
}