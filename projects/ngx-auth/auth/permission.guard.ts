import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthConfig } from './auth-config.model';
import { AUTH_CONFIG } from './auth-config.provider';
import { AuthRouteData } from './auth-route-data.model';
import { AuthService } from './auth.service';

/**
 * Lets only a user with the permissions of the route open it, which its data names as an AuthRouteData:
 * `{ canActivate: [permissionGuard], data: { permission: 'invoices.export' } }`. The tenant permission is checked in
 * the active tenant, or in the tenantId of the data. With both a permission and a platformPermission, the user needs
 * both, as a route of zibri with both decorators does; with neither, nobody opens it. A logged in user without them goes
 * to the forbidden route, and stays logged in; everybody else goes to the login route.
 * @param route - The route, with the permissions in its data.
 * @param state - The state of the router, with the url the user wanted.
 * @returns Whether the route opens, or where the user goes instead.
 */
export const permissionGuard: CanActivateFn = async (route, state) => {
    const config: AuthConfig = inject(AUTH_CONFIG);
    const authService: AuthService = inject<AuthService>(AuthService);
    const router: Router = inject(Router);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return true;
    }
    if (!authService.loggedIn()) {
        return router.createUrlTree([config.routes.login], { queryParams: { returnUrl: state.url } });
    }
    if (authService.currentUser() == undefined) {
        try {
            // GET /me didn't answer at the login or the refresh
            await authService.reloadCurrentUser();
        }
        catch {
            return router.parseUrl(config.routes.forbidden);
        }
    }
    const data: AuthRouteData = route.data;
    const tenantId: string | undefined = typeof data.tenantId === 'function' ? data.tenantId(route) : data.tenantId;
    const allowed: boolean = (data.permission != undefined || data.platformPermission != undefined)
        && (data.permission == undefined || authService.hasPermission(data.permission, tenantId))
        && (data.platformPermission == undefined || authService.hasPlatformPermission(data.platformPermission));
    return allowed ? true : router.parseUrl(config.routes.forbidden);
};