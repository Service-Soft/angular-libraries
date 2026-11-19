/**
 * An answer of the server that the offline cache keeps, to give it while the server can't be reached.
 */
export type CachedAnswer = {
    /**
     * Who and where it belongs to, and the url with its query, see OfflineCacheService.resolveKey.
     */
    key: string,
    /**
     * The body of the answer.
     */
    body: unknown,
    /**
     * When it was loaded from the server, as an ISO string.
     */
    loadedAt: string
};