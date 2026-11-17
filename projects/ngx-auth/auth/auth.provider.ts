import { EnvironmentProviders, makeEnvironmentProviders, Type } from '@angular/core';

import { AuthConfigChanges } from './auth-config-changes.model';
import { provideAuthConfig } from './auth-config.provider';
import { AuthService } from './auth.service';

/**
 * Sets up logging in at zibri: the AuthService of the app, which extends AuthService with its own roles and
 * permissions, and where and how to log in. Provide it in the application config, and register the authInterceptor
 * with provideHttpClient.
 * @param service - The AuthService of the app.
 * @param config - The apiUrl and the strategy, and what to change of the rest.
 * @returns The providers for the auth.
 */
export function provideAuth(service: Type<AuthService>, config: AuthConfigChanges): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideAuthConfig(config),
        // the guards, the interceptor and the components of ngx-auth inject AuthService, and get the one of the app
        { provide: AuthService, useExisting: service }
    ]);
}