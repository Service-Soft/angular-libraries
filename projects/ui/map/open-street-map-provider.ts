import { MapCoordinates } from './map-coordinates.model';
import { MapLocationUtilities } from './map-location.utilities';
import { MapProvider } from './map-provider.model';

const NAME: string = 'OpenStreetMap';

/**
 * OpenStreetMap, which needs the coordinates of a location to show it. The route leads there with the directions of
 * OpenStreetMap, or searches the address where the location has no coordinates.
 */
export const OPEN_STREET_MAP_PROVIDER: MapProvider = {
    name: NAME,
    privacyPolicyUrl: 'https://osmfoundation.org/wiki/Privacy_Policy',
    resolveEmbedUrl: (location, zoom) => {
        // the embed shows a box around its marker, which is only known by coordinates.
        const coordinates: MapCoordinates = MapLocationUtilities.getCoordinates(location, NAME);
        const box: string = MapLocationUtilities.resolveBox(coordinates, zoom);
        const marker: string = MapLocationUtilities.formatCoordinates(coordinates);
        // cspell:ignore mapnik
        return `https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${marker}`;
    },
    resolveRouteUrl: ({ address = '', coordinates }) => {
        // the route goes from where the user enters, the empty start before the ;, to the location.
        const route: string = coordinates == undefined ? '' : `;${MapLocationUtilities.formatCoordinates(coordinates)}`;
        return coordinates == undefined
            ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
            : `https://www.openstreetmap.org/directions?route=${encodeURIComponent(route)}`;
    }
};