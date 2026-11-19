/**
 * Who a request belongs to and where it is made, as the OfflineConfig tells them apart.
 */
export type OfflineContext = {
    /**
     * Who it belongs to, like the id of the logged in user, or undefined for everybody.
     */
    scope: string | undefined,
    /**
     * The values of the headers of the config, without the ones that have none.
     */
    headers: Record<string, string>
};