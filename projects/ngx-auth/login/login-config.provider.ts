import { inject, InjectionToken, Provider } from '@angular/core';

import { LoginConfigChanges } from './login-config-changes.model';
import { LoginConfig } from './login-config.model';

/**
 * How the login looks and works when nothing changes it. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultLoginConfig(): LoginConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.login.title:Log in`,
            email: $localize`:@@ngx-auth.login.email:Email`,
            password: $localize`:@@ngx-auth.login.password:Password`,
            login: $localize`:@@ngx-auth.login.login:Log in`,
            forgotPassword: $localize`:@@ngx-auth.login.forgotPassword:Forgot your password?`,
            loginWithPasskey: $localize`:@@ngx-auth.login.loginWithPasskey:Log in with a passkey`,
            secondFactorTitle: $localize`:@@ngx-auth.login.secondFactorTitle:Confirm it's you`,
            enrolledMessage: $localize`:@@ngx-auth.login.enrolledMessage:Your second factor is on. Confirm it once more to log in, with the next code.`,
            enrollmentTitle: $localize`:@@ngx-auth.login.enrollmentTitle:Set up a second factor`,
            enrollmentMessage: $localize`:@@ngx-auth.login.enrollmentMessage:Your account needs a second factor before you can log in. Choose how you want to confirm it's you.`,
            back: $localize`:@@ngx-auth.login.back:Back`,
            passwordChangeTitle: $localize`:@@ngx-auth.login.passwordChangeTitle:Choose a new password`,
            passwordChangeMessage: $localize`:@@ngx-auth.login.passwordChangeMessage:Your password has to be changed before you can go on.`,
            newPassword: $localize`:@@ngx-auth.login.newPassword:New password`,
            changePassword: $localize`:@@ngx-auth.login.changePassword:Change password`,
            failed: $localize`:@@ngx-auth.login.failed:Something went wrong. Please try again.`
        },
        requestPasswordResetRoute: '/request-password-reset',
        passkeyAuthenticator: undefined,
        providers: [],
        newPasswordMinLength: undefined
    };
}

/**
 * How the login looks and works. Change it with provideLoginConfig.
 */
export const LOGIN_CONFIG: InjectionToken<LoginConfig> = new InjectionToken<LoginConfig>('LOGIN_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultLoginConfig()
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
            const parent: LoginConfig = inject(LOGIN_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultLoginConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}