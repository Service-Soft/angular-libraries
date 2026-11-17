import { CachedRequest } from '@service-soft/ngx-pwa/offline';

/**
 * A change in the list of the sync dialog, ready to render.
 */
export type SyncRequestView = {
    /**
     * The request of the change.
     */
    request: CachedRequest,
    /**
     * What the request did, like 'New'.
     */
    methodLabel: string,
    /**
     * The id of the text that describes the change, which its buttons are described by.
     */
    descriptionId: string,
    /**
     * Whether it can be synced right now.
     */
    canSync: boolean
};