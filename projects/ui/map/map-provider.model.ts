import { MapLocation } from './map-location.model';

/**
 * Where a map comes from, like Google Maps or OpenStreetMap: GOOGLE_MAPS_PROVIDER and OPEN_STREET_MAP_PROVIDER are
 * built in, and any other provider that can be embedded in an iframe works as well.
 */
export type MapProvider = {
    /**
     * The name of the provider, which the consent asks for, like 'Google Maps'.
     */
    name: string,
    /**
     * The url of the privacy policy of the provider, linked before the consent.
     */
    privacyPolicyUrl: string,
    /**
     * Resolves the url of the page that shows the location in an iframe.
     * @param location - What the map shows.
     * @param zoom - How close it is, from 1 for the whole earth to about 20 for a house, like the zoom levels of web maps.
     * @returns The url.
     */
    resolveEmbedUrl: (location: MapLocation, zoom: number) => string,
    /**
     * Resolves the url of the page that plans the route to the location, from wherever the user is.
     * @param location - Where the route leads.
     * @returns The url.
     */
    resolveRouteUrl: (location: MapLocation) => string
};