import { ActivatedRouteSnapshot, Data } from '@angular/router';

/**
 * What the permissionGuard checks for a route, in its data. Combine it with the data of your own routes to have them
 * typed: `type AppRoute = Route & { data?: AuthRouteData<Permission, PlatformPermission> }`.
 */
export interface AuthRouteData<Permission extends string = string, PlatformPermission extends string = string> extends Data {
    /**
     * A permission the user needs in the tenant, like `@Auth.hasPermission` of zibri.
     */
    permission?: Permission,
    /**
     * A permission the user needs by their own roles, like `@Auth.hasPlatformPermission` of zibri.
     */
    platformPermission?: PlatformPermission,
    /**
     * The tenant the permission is checked in, like one of the url, in place of the active tenant.
     */
    tenantId?: string | ((route: ActivatedRouteSnapshot) => string | undefined)
}