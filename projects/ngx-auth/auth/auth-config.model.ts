import { Type } from '@angular/core';

import { AuthHeaders } from './auth-headers.model';
import { AuthPaths } from './auth-paths.model';
import { AuthRoutes } from './auth-routes.model';
import { AuthStrategyName } from './auth-strategy-name.type';
import { SecondFactorPrompt } from './second-factor-prompt.service';

/**
 * How the app logs in at zibri.
 */
export type AuthConfig = {
    /**
     * The url of the AuthController, like 'https://api.example.com/auth'.
     */
    apiUrl: string,
    /**
     * How the browser stays logged in.
     */
    strategy: AuthStrategyName,
    /**
     * Whether the tokens of a jwt login are bound to a key of this browser (DPoP, RFC 9449), which every request proves
     * it holds, so stolen tokens are of no use anywhere else. Zibri binds a login to the key its request proves, and
     * with its jwt strategy's `requireDpop` refuses one without. Only for the jwt strategy.
     */
    dpop: boolean,
    /**
     * The origins requests get the login for, like 'https://api.example.com'. Every other request is sent without it,
     * so no token reaches a third party.
     */
    origins: string[],
    /**
     * The paths of the auth routes below the apiUrl.
     */
    paths: AuthPaths,
    /**
     * The names of the headers of the auth.
     */
    headers: AuthHeaders,
    /**
     * The routes of the app the auth sends the user to.
     */
    routes: AuthRoutes,
    /**
     * The statuses of a refused request that end the login of this browser, after a refresh didn't help.
     */
    logoutStatuses: number[],
    /**
     * How long before the access token runs out it is refreshed, in milliseconds.
     */
    refreshBeforeExpiryInMs: number,
    /**
     * Runs before a logout and a logout everywhere, while the user is still logged in, like to sync what they changed
     * offline first. It runs in an injection context, so it can use inject(). The user stays logged in when it answers
     * false. Logs out by default.
     */
    beforeLogout: () => boolean | Promise<boolean>,
    /**
     * Runs whenever the login of this browser ends, once it is gone: at a logout, and when the server ended it. Like to
     * delete what the app kept of the user. It runs in an injection context, so it can use inject().
     */
    onLogout: () => void | Promise<void>,
    /**
     * Loads what asks the user for a second factor when a request needs one, with a dynamic import(). Without it, such
     * a request fails.
     */
    secondFactorPrompt?: () => Promise<Type<SecondFactorPrompt>>
};