import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { UpdateService } from './update.service';
import { UpdatesConfigChanges } from './updates-config-changes.model';
import { provideUpdatesConfig } from './updates-config.provider';

/**
 * Asks the user to reload once the service worker has downloaded a new version of the app, in a dialog of
 * `@service-soft/ui/dialog` that is only loaded then. Provide it in the application config, next to
 * provideServiceWorker.
 * @param config - The values to change, like the labels to translate them. Values you leave out keep their defaults.
 * @returns The providers for the updates.
 */
export function provideUpdates(config: UpdatesConfigChanges = {}): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideUpdatesConfig(config),
        provideAppInitializer(() => {
            inject(UpdateService);
        })
    ]);
}