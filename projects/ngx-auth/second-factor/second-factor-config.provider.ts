import { inject, InjectionToken, Provider } from '@angular/core';

import { SecondFactorConfigChanges } from './second-factor-config-changes.model';
import { SecondFactorConfig } from './second-factor-config.model';

/**
 * How second factors are asked for and enrolled when nothing changes it. Its texts are $localize, which an app
 * translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply as
 * well.
 * @returns The default config.
 */
function getDefaultSecondFactorConfig(): SecondFactorConfig {
    return {
        labels: {
            code: $localize`:@@ngx-auth.second-factor.code:Code`,
            methods: {
                otp: {
                    name: $localize`:@@ngx-auth.second-factor.methods.otp.name:Authenticator app`,
                    choose: $localize`:@@ngx-auth.second-factor.methods.otp.choose:Use your authenticator app`,
                    hint: $localize`:@@ngx-auth.second-factor.methods.otp.hint:Enter the code your authenticator app shows.`
                },
                email: {
                    name: $localize`:@@ngx-auth.second-factor.methods.email.name:Codes by email`,
                    choose: $localize`:@@ngx-auth.second-factor.methods.email.choose:Get a code by email`,
                    hint: $localize`:@@ngx-auth.second-factor.methods.email.hint:Enter the code we sent to your email.`
                },
                sms: {
                    name: $localize`:@@ngx-auth.second-factor.methods.sms.name:Codes by text message`,
                    choose: $localize`:@@ngx-auth.second-factor.methods.sms.choose:Get a code by text message`,
                    hint: $localize`:@@ngx-auth.second-factor.methods.sms.hint:Enter the code we sent to your phone.`
                },
                'recovery-code': {
                    name: $localize`:@@ngx-auth.second-factor.methods.recovery-code.name:Recovery codes`,
                    choose: $localize`:@@ngx-auth.second-factor.methods.recovery-code.choose:Use a recovery code`,
                    hint: $localize`:@@ngx-auth.second-factor.methods.recovery-code.hint:Enter one of the recovery codes you saved.`
                },
                passkey: {
                    name: $localize`:@@ngx-auth.second-factor.methods.passkey.name:Passkeys`,
                    choose: $localize`:@@ngx-auth.second-factor.methods.passkey.choose:Use a passkey`,
                    hint: $localize`:@@ngx-auth.second-factor.methods.passkey.hint:Use a passkey of this device, or your security key.`
                }
            },
            noMethod: $localize`:@@ngx-auth.second-factor.noMethod:None of your second factors can be used here.`,
            sendCode: $localize`:@@ngx-auth.second-factor.sendCode:Send a new code`,
            confirm: $localize`:@@ngx-auth.second-factor.confirm:Confirm`,
            usePasskey: $localize`:@@ngx-auth.second-factor.usePasskey:Use passkey`,
            codeSent: $localize`:@@ngx-auth.second-factor.codeSent:We sent you a code.`,
            newCodeSent: $localize`:@@ngx-auth.second-factor.newCodeSent:We sent you a new code.`
        },
        // the two factor methods of zibri, by the names it gives them.
        methods: {
            otp: { confirmation: 'code', sendsCode: false, numeric: true, enrollment: 'authenticatorApp' },
            email: { confirmation: 'code', sendsCode: true, numeric: true, enrollment: 'emailCode' },
            sms: { confirmation: 'code', sendsCode: true, numeric: true, enrollment: 'smsCode' },
            'recovery-code': { confirmation: 'code', sendsCode: false, numeric: false, enrollment: 'recoveryCodes' },
            passkey: { confirmation: 'passkey', sendsCode: false, numeric: false, enrollment: 'passkey' }
        }
    };
}

/**
 * How second factors are asked for and enrolled. Change it with provideSecondFactorConfig.
 */
export const SECOND_FACTOR_CONFIG: InjectionToken<SecondFactorConfig> = new InjectionToken<SecondFactorConfig>('SECOND_FACTOR_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultSecondFactorConfig()
});

/**
 * Changes how second factors are asked for and enrolled, in the login, the dialog of a request and the settings, like
 * their texts to translate them. Values you leave out keep the ones of the parent injector, including single labels and
 * methods. Provide it in the application config: the dialog opens from the root of the app.
 * @param config - The values to change.
 * @returns The provider for SECOND_FACTOR_CONFIG.
 */
export function provideSecondFactorConfig(config: SecondFactorConfigChanges): Provider {
    return {
        provide: SECOND_FACTOR_CONFIG,
        useFactory: (): SecondFactorConfig => {
            const parent: SecondFactorConfig = inject(SECOND_FACTOR_CONFIG, { skipSelf: true, optional: true })
                ?? getDefaultSecondFactorConfig();
            return {
                labels: { ...parent.labels, ...config.labels, methods: { ...parent.labels.methods, ...config.labels?.methods } },
                methods: { ...parent.methods, ...config.methods }
            };
        }
    };
}