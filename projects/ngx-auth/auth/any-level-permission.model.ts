/**
 * A permission that the user may have at either level, like `@Auth.hasAnyLevelPermission` of zibri takes it: in the
 * tenant, or by their own roles. Either is enough.
 */
export type AnyLevelPermission<Permission extends string = string, PlatformPermission extends string = string> = {
    /**
     * The permission in the tenant, which a role of the user's membership there carries.
     */
    permission: Permission,
    /**
     * The permission by the user's own roles, which counts in every tenant and without one.
     */
    platformPermission: PlatformPermission
};