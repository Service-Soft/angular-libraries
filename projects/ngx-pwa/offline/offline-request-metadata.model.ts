/**
 * What the OfflineService needs to know about a request to keep it while the user is offline. Only requests that have
 * it in their context are kept, see OFFLINE_REQUEST_METADATA.
 */
export type OfflineRequestMetadata = {
    /**
     * The type of the entity the request changes, like 'todo'. The changes of a type are applied to its entities by
     * applyOfflineData.
     */
    type: string,
    /**
     * The property that holds the id of the entity. Defaults to 'id'.
     */
    idKey?: string,
    /**
     * What the user sees of the request in the sync dialog, like 'New todo: Buy milk'. Defaults to its url.
     */
    displayValue?: string
};