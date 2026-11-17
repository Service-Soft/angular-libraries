import { inject, InjectionToken, Provider } from '@angular/core';

import { GOOGLE_MAPS_PROVIDER } from './google-maps-provider';
import { MapConfig } from './map-config.model';

const DEFAULT_MAP_CONFIG: MapConfig = {
    provider: GOOGLE_MAPS_PROVIDER,
    zoom: 15,
    aspectRatio: '16 / 9',
    label: 'Map',
    routeLabel: 'Plan route'
};

/**
 * The values every map below this injector uses when its inputs are not set, and its texts.
 * Change them with provideMapConfig.
 */
export const MAP_CONFIG: InjectionToken<MapConfig> = new InjectionToken<MapConfig>('MAP_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_MAP_CONFIG
});

/**
 * Changes the values maps use when their inputs are not set, and their texts, like the provider of every map of the
 * app: `provideMapConfig({ provider: OPEN_STREET_MAP_PROVIDER })`.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for MAP_CONFIG.
 */
export function provideMapConfig(config: Partial<MapConfig>): Provider {
    return {
        provide: MAP_CONFIG,
        useFactory: (): MapConfig => ({
            ...inject(MAP_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_MAP_CONFIG,
            ...config
        })
    };
}