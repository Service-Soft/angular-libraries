import { AuthConfig } from './auth-config.model';
import { AuthHeaders } from './auth-headers.model';

/**
 * What provideAuth is given: the apiUrl and the strategy, and what to change of the rest. Values left out keep their
 * defaults, including single paths, headers and routes.
 */
export type AuthConfigChanges = Pick<AuthConfig, 'apiUrl' | 'strategy'>
    & Partial<Omit<AuthConfig, 'apiUrl' | 'strategy' | 'paths' | 'headers' | 'routes'>>
    & {
        /**
         * The paths to change.
         */
        paths?: Partial<AuthConfig['paths']>,
        /**
         * The headers to change.
         */
        headers?: Partial<Omit<AuthHeaders, 'secondFactors'>> & {
            /**
             * The headers of the two factor methods to change or add.
             */
            secondFactors?: Record<string, string>
        },
        /**
         * The routes to change.
         */
        routes?: Partial<AuthConfig['routes']>
    };