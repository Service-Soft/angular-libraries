import { MapLocationUtilities } from './map-location.utilities';
import { MapProvider } from './map-provider.model';

// Google finds an address by its text, which shows the place with its name, and a point by its coordinates.

/**
 * Google Maps, the default provider of ui-map. It needs no api key: the map is the embed of a search on Google Maps,
 * and the route the directions of Google Maps from where the user is.
 */
export const GOOGLE_MAPS_PROVIDER: MapProvider = {
    name: 'Google Maps',
    privacyPolicyUrl: 'https://policies.google.com/privacy',
    resolveEmbedUrl: (location, zoom) => {
        const query: string = encodeURIComponent(MapLocationUtilities.resolveQuery(location));
        return `https://www.google.com/maps?q=${query}&z=${zoom}&output=embed`;
    },
    resolveRouteUrl: location => {
        const destination: string = encodeURIComponent(MapLocationUtilities.resolveQuery(location));
        return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
};