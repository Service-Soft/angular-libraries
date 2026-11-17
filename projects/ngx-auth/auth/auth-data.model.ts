import { CurrentUserProfile, Jwt } from 'zibri-contract';

/**
 * The login of this browser, as the AuthService keeps it in the localStorage.
 */
export type AuthData<Role extends string, Permission extends string = string, PlatformPermission extends string = string> = {
    /**
     * The id of the user.
     */
    userId: string,
    /**
     * The roles of the user.
     */
    roles: Role[],
    /**
     * When the login ends unless it is refreshed before, as an ISO string.
     */
    expiresAt: string,
    /**
     * The user and what they may do, as `GET /me` answered at the last login or refresh. Undefined until it answered.
     */
    user?: CurrentUserProfile<Permission, PlatformPermission>,
    /**
     * The tenant the user acts in, which requests to the api name and permissions are checked in.
     */
    activeTenantId?: string
} & ({
    /**
     * Logged in with tokens.
     */
    strategy: 'jwt',
    /**
     * The token every request sends.
     */
    accessToken: Jwt,
    /**
     * The token that gets new tokens.
     */
    refreshToken: Jwt
} | {
    /**
     * Logged in with cookies, which the browser keeps itself.
     */
    strategy: 'cookie'
});