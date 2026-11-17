import { MapCoordinates } from './map-coordinates.model';

/**
 * What a map shows and leads the route to: an address, its coordinates, or both. Google Maps finds an address by its
 * text; OpenStreetMap needs the coordinates to show it.
 */
export type MapLocation = {
    /**
     * The address as it is written, like 'Main Street 1, 50999 Cologne'.
     */
    address: string,
    /**
     * The point of the address, where a provider needs it.
     */
    coordinates?: MapCoordinates
} | {
    /**
     * The address as it is written, like 'Main Street 1, 50999 Cologne'.
     */
    address?: string,
    /**
     * The point to show.
     */
    coordinates: MapCoordinates
};