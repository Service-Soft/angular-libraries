import { inject, InjectionToken, Provider } from '@angular/core';

import { LoginConfigChanges } from './login-config-changes.model';
import { LoginConfig } from './login-config.model';

const DEFAULT_LOGIN_CONFIG: LoginConfig = {
    labels: {
        title: 'Log in',
        email: 'Email',
        password: 'Password',
        login: 'Log in',
        forgotPassword: 'Forgot your password?',
        loginWithPasskey: 'Log in with a passkey',
        secondFactorTitle: 'Confirm it\'s you',
        enrolledMessage: 'Your second factor is on. Confirm it once more to log in, with the next code.',
        enrollmentTitle: 'Set up a second factor',
        enrollmentMessage: 'Your account needs a second factor before you can log in. Choose how you want to confirm it\'s you.',
        back: 'Back',
        passwordChangeTitle: 'Choose a new password',
        passwordChangeMessage: 'Your password has to be changed before you can go on.',
        newPassword: 'New password',
        changePassword: 'Change password',
        failed: 'Something went wrong. Please try again.'
    },
    requestPasswordResetRoute: '/request-password-reset',
    passkeyAuthenticator: undefined,
    providers: [],
    newPasswordMinLength: undefined
};

/**
 * How the login looks and works. Change it with provideLoginConfig.
 */
export const LOGIN_CONFIG: InjectionToken<LoginConfig> = new InjectionToken<LoginConfig>('LOGIN_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_LOGIN_CONFIG
});

/**
 * Changes how the login looks and works, like its texts to translate them. Values you leave out keep the ones of the
 * parent injector, including single labels, so it works in the application config as well as on a route.
 * @param config - The values to change.
 * @returns The provider for LOGIN_CONFIG.
 */
export function provideLoginConfig(config: LoginConfigChanges): Provider {
    return {
        provide: LOGIN_CONFIG,
        useFactory: (): LoginConfig => {
            const parent: LoginConfig = inject(LOGIN_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_LOGIN_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}