import { InjectionToken, Provider } from '@angular/core';

import { AuthConfigChanges } from './auth-config-changes.model';
import { AuthConfig } from './auth-config.model';
import { AuthHeaders } from './auth-headers.model';
import { AuthPaths } from './auth-paths.model';
import { AuthRoutes } from './auth-routes.model';

// what the AuthController of zibri serves, below the path the app gave it.
const DEFAULT_PATHS: AuthPaths = {
    login: '/login',
    refreshLogin: '/refresh-login',
    logout: '/logout',
    currentUser: '/me',
    csrfToken: '/csrf-token',
    loginSecondFactorRequest: '/login/2fa/request',
    loginSecondFactorConfirm: '/login/2fa/confirm',
    loginChangePassword: '/login/change-password',
    twoFactorRegistrations: '/2fa/registrations',
    twoFactorRegistrationRequest: '/2fa/registration/request',
    twoFactorRegistrationConfirm: '/2fa/registration/confirm',
    twoFactorRegistration: '/2fa/registration',
    loginTwoFactorRegistrationRequest: '/login/2fa/registration/request',
    loginTwoFactorRegistrationConfirm: '/login/2fa/registration/confirm',
    secondFactorRequest: '/2fa/request',
    loginOptions: '/login-options',
    registrationRequest: '/registration/request',
    registrationConfirm: '/registration/confirm',
    federatedLoginRequest: '/federated/login/request',
    linkIdentityRequest: '/link-identity/request',
    linkIdentityConfirm: '/link-identity/confirm',
    identities: '/identities',
    logins: '/logins',
    logoutEverywhere: '/logout-everywhere',
    requestEmailVerification: '/request-email-verification',
    requestEmailChange: '/request-email-change',
    confirmEmail: '/confirm-email',
    requestPasswordReset: '/request-password-reset',
    verifyPasswordResetToken: '/verify-password-reset-token',
    confirmPasswordReset: '/confirm-password-reset',
    changePassword: '/change-password',
    verifyInvitationToken: '/verify-invitation-token',
    acceptInvitation: '/accept-invitation',
    declineInvitation: '/decline-invitation'
};

// the defaults of zibri's ZIBRI_DI_TOKENS, which an app can rename.
const DEFAULT_HEADERS: AuthHeaders = {
    loginTicket: 'x-login-ticket',
    csrfToken: 'x-csrf-token',
    tenantId: 'x-tenant-id',
    secondFactors: {
        otp: 'x-authorization-otp',
        email: 'x-authorization-email-code',
        sms: 'x-authorization-sms-code',
        'recovery-code': 'x-authorization-recovery-code',
        passkey: 'x-authorization-passkey'
    }
};

const DEFAULT_ROUTES: AuthRoutes = {
    login: '/login',
    afterLogin: '/',
    afterLogout: '/login',
    forbidden: '/'
};

const DEFAULT_REFRESH_BEFORE_EXPIRY_IN_MS: number = 30_000;

/**
 * How the app logs in at zibri. Set it with provideAuth.
 */
export const AUTH_CONFIG: InjectionToken<AuthConfig> = new InjectionToken<AuthConfig>('AUTH_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The AuthService needs to know where to log in. Add provideAuth(MyAuthService, { apiUrl, strategy }) '
            + 'to the providers of your app.');
    }
});

/**
 * Sets where and how the app logs in. Part of provideAuth, which also sets the AuthService of the app.
 * @param config - The apiUrl and the strategy, and what to change of the rest.
 * @returns The provider for AUTH_CONFIG.
 * @throws {Error} When DPoP is asked for without the jwt strategy.
 */
export function provideAuthConfig(config: AuthConfigChanges): Provider {
    if (config.dpop === true && config.strategy !== 'jwt') {
        throw new Error('DPoP binds the tokens of a jwt login to a key, so it needs the strategy \'jwt\'.');
    }
    // no merging with a parent injector: the AuthService lives in the root injector and never sees a config further down.
    const authConfig: AuthConfig = {
        dpop: false,
        origins: [],
        logoutStatuses: [401],
        refreshBeforeExpiryInMs: DEFAULT_REFRESH_BEFORE_EXPIRY_IN_MS,
        beforeLogout: () => true,
        onLogout: () => undefined,
        ...config,
        paths: { ...DEFAULT_PATHS, ...config.paths },
        headers: {
            ...DEFAULT_HEADERS,
            ...config.headers,
            secondFactors: { ...DEFAULT_HEADERS.secondFactors, ...config.headers?.secondFactors }
        },
        routes: { ...DEFAULT_ROUTES, ...config.routes }
    };
    return { provide: AUTH_CONFIG, useValue: authConfig };
}