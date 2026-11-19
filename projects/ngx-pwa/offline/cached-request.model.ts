import { CachedRequestMethod } from './cached-request-method.type';

/**
 * A request that was made while the user was offline, kept in the browser until it is synced.
 */
export type CachedRequest = {
    /**
     * Identifies the request. An entity created offline gets it as its id, until the server gave it a real one.
     */
    id: string,
    /**
     * The method of the request.
     */
    method: CachedRequestMethod,
    /**
     * The url of the request, with its parameters.
     */
    url: string,
    /**
     * The body of the request, exactly as it is sent.
     */
    body: unknown,
    /**
     * The type of the entity the request changes.
     */
    type: string,
    /**
     * The property that holds the id of the entity.
     */
    idKey: string,
    /**
     * What the user sees of the request.
     */
    displayValue: string,
    /**
     * Who made the request, the scope of the OfflineConfig. Undefined for a request of everybody.
     */
    scope?: string,
    /**
     * The values the headers of the OfflineConfig had, which the request is synced with. Undefined for a request kept
     * before they were, which is synced with the headers of the moment and shows everywhere.
     */
    headers?: Record<string, string>
};