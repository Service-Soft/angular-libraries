/**
 * The names of the headers zibri reads and sends for auth.
 */
export type AuthHeaders = {
    /**
     * The ticket that continues a login.
     */
    loginTicket: string,
    /**
     * The csrf token of a cookie login, which requests send and responses renew.
     */
    csrfToken: string,
    /**
     * The tenant a request acts in, which requests to the api send for the active tenant.
     */
    tenantId: string,
    /**
     * The header of each two factor method, by its name, like `{ otp: 'x-authorization-otp' }`.
     */
    secondFactors: Record<string, string>
};