import { inject, InjectionToken, Provider } from '@angular/core';

import { SecondFactorConfigChanges } from './second-factor-config-changes.model';
import { SecondFactorConfig } from './second-factor-config.model';

const DEFAULT_SECOND_FACTOR_CONFIG: SecondFactorConfig = {
    labels: {
        code: 'Code',
        methods: {
            otp: {
                name: 'Authenticator app',
                choose: 'Use your authenticator app',
                hint: 'Enter the code your authenticator app shows.'
            },
            email: { name: 'Codes by email', choose: 'Get a code by email', hint: 'Enter the code we sent to your email.' },
            sms: { name: 'Codes by text message', choose: 'Get a code by text message', hint: 'Enter the code we sent to your phone.' },
            'recovery-code': {
                name: 'Recovery codes',
                choose: 'Use a recovery code',
                hint: 'Enter one of the recovery codes you saved.'
            },
            passkey: { name: 'Passkeys', choose: 'Use a passkey', hint: 'Use a passkey of this device, or your security key.' }
        },
        noMethod: 'None of your second factors can be used here.',
        sendCode: 'Send a new code',
        confirm: 'Confirm',
        usePasskey: 'Use passkey',
        codeSent: 'We sent you a code.',
        newCodeSent: 'We sent you a new code.'
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

/**
 * How second factors are asked for and enrolled. Change it with provideSecondFactorConfig.
 */
export const SECOND_FACTOR_CONFIG: InjectionToken<SecondFactorConfig> = new InjectionToken<SecondFactorConfig>('SECOND_FACTOR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SECOND_FACTOR_CONFIG
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
                ?? DEFAULT_SECOND_FACTOR_CONFIG;
            return {
                labels: { ...parent.labels, ...config.labels, methods: { ...parent.labels.methods, ...config.labels?.methods } },
                methods: { ...parent.methods, ...config.methods }
            };
        }
    };
}