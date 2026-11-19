/**
 * Who the changes made offline and the answers of the offline cache belong to, and where they were made. Set it with
 * provideOfflineConfig.
 */
export type OfflineConfig = {
    /**
     * The headers that tell apart where a request is made, each with its current value, like the tenant:
     * `{ 'x-tenant-id': () => inject(AuthService).activeTenantId() }`. A request that sets one itself has its own value.
     * A change made offline is kept with their values and synced with them, whatever they are by then, and
     * applyOfflineData shows it only while they are the same. The offline cache answers only a request with the same
     * values. They run in an injection context, and signals they read are followed.
     */
    headers: Record<string, () => string | undefined>,
    /**
     * Who a request belongs to, like the logged in user: `() => inject(AuthService).authData()?.userId`. A change made
     * offline is shown and synced only while it is the same, so never with the login of somebody else, and the offline
     * cache answers only them. A change made while it was undefined belongs to everybody. It runs in an injection
     * context, and signals it reads are followed.
     */
    scope: () => string | undefined
};