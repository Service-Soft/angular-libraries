import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthConfig } from './auth-config.model';
import { AUTH_CONFIG } from './auth-config.provider';
import { AuthService } from './auth.service';

/**
 * Lets only a logged in user open the route. Everybody else goes to the login route, with the page they wanted as
 * `returnUrl`. On the server, which knows no login, it lets the route render: render such routes on the client.
 * @param route - The route.
 * @param state - The state of the router, with the url the user wanted.
 * @returns Whether the route opens, or where the user goes instead.
 */
export const loggedInGuard: CanActivateFn = (route, state) => {
    const config: AuthConfig = inject(AUTH_CONFIG);
    const router: Router = inject(Router);
    return !isPlatformBrowser(inject(PLATFORM_ID)) || inject(AuthService).loggedIn()
        ? true
        : router.createUrlTree([config.routes.login], { queryParams: { returnUrl: state.url } });
};