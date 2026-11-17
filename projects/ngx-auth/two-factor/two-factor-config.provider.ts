import { inject, InjectionToken, Provider } from '@angular/core';

import { TwoFactorConfigChanges } from './two-factor-config-changes.model';
import { TwoFactorConfig } from './two-factor-config.model';

const DEFAULT_TWO_FACTOR_CONFIG: TwoFactorConfig = {
    labels: {
        dialogTitle: 'Confirm it\'s you',
        cancel: 'Cancel',
        scanQrCode: 'Scan the QR code with your authenticator app, then enter the code it shows.',
        qrCode: 'QR code for your authenticator app',
        secret: 'Can\'t scan it? Enter this key in the app instead:',
        phoneNumber: 'Phone number',
        phoneNumberHint: 'With the country code, like +49 151 12345678.',
        sendCode: 'Send code',
        saveRecoveryCodes: 'Save these codes somewhere safe, like in a password manager. Each one works once, when you can\'t use '
            + 'your other second factors. You won\'t see them again.',
        confirmRecoveryCodes: 'Enter one of the codes, to show that you saved them.',
        createPasskeyMessage: 'Your device asks you to confirm the passkey, like with your fingerprint, your face or its PIN.',
        createPasskey: 'Create passkey',
        turnOn: 'Turn on',
        retry: 'Try again',
        settingsTitle: 'Two-factor authentication',
        on: 'On',
        off: 'Off',
        setUp: 'Set up',
        newRecoveryCodes: 'Get new codes',
        turnOff: 'Turn off',
        turnOffTitle: 'Turn off this second factor?',
        turnOffMessage: 'Your account is less safe with fewer second factors.',
        turnedOn: 'Turned on.',
        turnedOff: 'Turned off.',
        failed: 'Something went wrong. Please try again.'
    }
};

/**
 * What the dialog, the enrollment and the settings of two factor methods show. Change it with provideTwoFactorConfig.
 */
export const TWO_FACTOR_CONFIG: InjectionToken<TwoFactorConfig> = new InjectionToken<TwoFactorConfig>('TWO_FACTOR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_TWO_FACTOR_CONFIG
});

/**
 * Changes what the dialog, the enrollment and the settings of two factor methods show, like their texts to translate
 * them. Values you leave out keep the ones of the parent injector, including single labels. Provide it in the
 * application config: the dialog opens from the root of the app.
 * @param config - The values to change.
 * @returns The provider for TWO_FACTOR_CONFIG.
 */
export function provideTwoFactorConfig(config: TwoFactorConfigChanges): Provider {
    return {
        provide: TWO_FACTOR_CONFIG,
        useFactory: (): TwoFactorConfig => {
            const parent: TwoFactorConfig = inject(TWO_FACTOR_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_TWO_FACTOR_CONFIG;
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}