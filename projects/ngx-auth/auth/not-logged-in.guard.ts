import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthConfig } from './auth-config.model';
import { AUTH_CONFIG } from './auth-config.provider';
import { AuthService } from './auth.service';

/**
 * Lets only a user who isn't logged in open the route, like the login page. A logged in user goes to the afterLogin
 * route.
 * @returns Whether the route opens, or where the user goes instead.
 */
export const notLoggedInGuard: CanActivateFn = () => {
    const config: AuthConfig = inject(AUTH_CONFIG);
    return inject(AuthService).loggedIn() ? inject(Router).parseUrl(config.routes.afterLogin) : true;
};