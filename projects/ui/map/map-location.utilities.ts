import { MapCoordinates } from './map-coordinates.model';
import { MapLocation } from './map-location.model';

// the degrees of longitude a web map shows at zoom 0, the whole earth. Each zoom level halves them.
const EARTH_DEGREES: number = 360;

/**
 * Utilities for the locations of maps, for a MapProvider of your own as well.
 */
export abstract class MapLocationUtilities {
    /**
     * Resolves what a map searches for a location: its address, or its coordinates where it has no address, like
     * '50.9375,6.9603'.
     * @param location - The location, which has at least one of them.
     * @returns The text to search.
     */
    static resolveQuery(location: MapLocation): string {
        const { address, coordinates } = location;
        return address ?? (coordinates == undefined ? '' : this.formatCoordinates(coordinates));
    }

    /**
     * Gets the coordinates of a location, for a provider that can only show coordinates.
     * @param location - The location.
     * @param provider - The name of the provider, which the error names.
     * @returns The coordinates.
     * @throws {Error} When the location has no coordinates.
     */
    static getCoordinates(location: MapLocation, provider: string): MapCoordinates {
        if (location.coordinates == undefined) {
            throw new Error(`${provider} shows a location by its coordinates, give the location of ui-map its coordinates.`);
        }
        return location.coordinates;
    }

    /**
     * Formats coordinates as latitude and longitude, like '50.9375,6.9603'.
     * @param coordinates - The coordinates.
     * @returns The text.
     */
    static formatCoordinates(coordinates: MapCoordinates): string {
        return `${coordinates.latitude},${coordinates.longitude}`;
    }

    /**
     * Resolves the box around a point that a map shows at a zoom level: as wide as the zoom level shows and half as high,
     * which fills a map in 16:9 at about that zoom.
     * @param coordinates - The point in the middle.
     * @param zoom - The zoom level, from 1 for the whole earth to about 20 for a house.
     * @returns The longitude and latitude of the south west and of the north east corner, like '6.95755,50.93613,6.96305,50.93887'.
     */
    static resolveBox(coordinates: MapCoordinates, zoom: number): string {
        const width: number = EARTH_DEGREES / (2 ** zoom);
        const { latitude, longitude } = coordinates;
        const corners: number[] = [longitude - (width / 2), latitude - (width / 4), longitude + (width / 2), latitude + (width / 4)];
        return corners.map(degrees => degrees.toFixed(5)).join(',');
    }
}