import { MapProvider } from './map-provider.model';

/**
 * The values a map uses when its inputs are not set, and its texts.
 */
export type MapConfig = {
    /**
     * Where the map comes from.
     */
    provider: MapProvider,
    /**
     * How close the map is, from 1 for the whole earth to about 20 for a house.
     */
    zoom: number,
    /**
     * The ratio of the width of the map to its height, or undefined to fill the height of the map component.
     */
    aspectRatio: string | undefined,
    /**
     * What screen readers call the map, the title of its iframe.
     */
    label: string,
    /**
     * The text of the link that plans the route to the location.
     */
    routeLabel: string
};