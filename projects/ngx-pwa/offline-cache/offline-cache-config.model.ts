/**
 * Which answers the offline cache keeps, and for how long. Set it with provideOfflineCache.
 */
export type OfflineCacheConfig = {
    /**
     * The beginnings of the urls of the GET requests whose answers it keeps, like the url of your api.
     */
    urls: string[],
    /**
     * How long an answer is given once it was loaded, in milliseconds. An older one is deleted instead.
     */
    maxAgeInMs: number
};