import { inject, InjectionToken, Provider } from '@angular/core';

import { GOOGLE_MAPS_PROVIDER } from './google-maps-provider';
import { MapConfig } from './map-config.model';

/**
 * The values of a map when nothing changes them. Its texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultMapConfig(): MapConfig {
    return {
        provider: GOOGLE_MAPS_PROVIDER,
        zoom: 15,
        aspectRatio: '16 / 9',
        label: $localize`:@@ui.map.label:Map`,
        routeLabel: $localize`:@@ui.map.routeLabel:Plan route`
    };
}

/**
 * The values every map below this injector uses when its inputs are not set, and its texts.
 * Change them with provideMapConfig.
 */
export const MAP_CONFIG: InjectionToken<MapConfig> = new InjectionToken<MapConfig>('MAP_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultMapConfig()
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
            ...inject(MAP_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultMapConfig(),
            ...config
        })
    };
}