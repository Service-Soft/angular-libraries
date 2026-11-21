import { inject, InjectionToken, Provider } from '@angular/core';

import { TwoFactorConfigChanges } from './two-factor-config-changes.model';
import { TwoFactorConfig } from './two-factor-config.model';

/**
 * What the dialog, the enrollment and the settings of two factor methods show when nothing changes it. Its texts are
 * $localize, which an app translates like its own, and resolved once the config is injected, so translations an app
 * loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultTwoFactorConfig(): TwoFactorConfig {
    return {
        labels: {
            dialogTitle: $localize`:@@ngx-auth.two-factor.dialogTitle:Confirm it's you`,
            cancel: $localize`:@@ngx-auth.two-factor.cancel:Cancel`,
            scanQrCode: $localize`:@@ngx-auth.two-factor.scanQrCode:Scan the QR code with your authenticator app, then enter the code it shows.`,
            qrCode: $localize`:@@ngx-auth.two-factor.qrCode:QR code for your authenticator app`,
            secret: $localize`:@@ngx-auth.two-factor.secret:Can't scan it? Enter this key in the app instead:`,
            phoneNumber: $localize`:@@ngx-auth.two-factor.phoneNumber:Phone number`,
            phoneNumberHint: $localize`:@@ngx-auth.two-factor.phoneNumberHint:With the country code, like +49 151 12345678.`,
            sendCode: $localize`:@@ngx-auth.two-factor.sendCode:Send code`,
            saveRecoveryCodes: $localize`:@@ngx-auth.two-factor.saveRecoveryCodes:Save these codes somewhere safe, like in a password manager. Each one works once, when you can't use your other second factors. You won't see them again.`,
            confirmRecoveryCodes: $localize`:@@ngx-auth.two-factor.confirmRecoveryCodes:Enter one of the codes, to show that you saved them.`,
            createPasskeyMessage: $localize`:@@ngx-auth.two-factor.createPasskeyMessage:Your device asks you to confirm the passkey, like with your fingerprint, your face or its PIN.`,
            createPasskey: $localize`:@@ngx-auth.two-factor.createPasskey:Create passkey`,
            turnOn: $localize`:@@ngx-auth.two-factor.turnOn:Turn on`,
            retry: $localize`:@@ngx-auth.two-factor.retry:Try again`,
            settingsTitle: $localize`:@@ngx-auth.two-factor.settingsTitle:Two-factor authentication`,
            on: $localize`:@@ngx-auth.two-factor.on:On`,
            off: $localize`:@@ngx-auth.two-factor.off:Off`,
            setUp: $localize`:@@ngx-auth.two-factor.setUp:Set up`,
            newRecoveryCodes: $localize`:@@ngx-auth.two-factor.newRecoveryCodes:Get new codes`,
            turnOff: $localize`:@@ngx-auth.two-factor.turnOff:Turn off`,
            turnOffTitle: $localize`:@@ngx-auth.two-factor.turnOffTitle:Turn off this second factor?`,
            turnOffMessage: $localize`:@@ngx-auth.two-factor.turnOffMessage:Your account is less safe with fewer second factors.`,
            turnedOn: $localize`:@@ngx-auth.two-factor.turnedOn:Turned on.`,
            turnedOff: $localize`:@@ngx-auth.two-factor.turnedOff:Turned off.`,
            failed: $localize`:@@ngx-auth.two-factor.failed:Something went wrong. Please try again.`
        }
    };
}

/**
 * What the dialog, the enrollment and the settings of two factor methods show. Change it with provideTwoFactorConfig.
 */
export const TWO_FACTOR_CONFIG: InjectionToken<TwoFactorConfig> = new InjectionToken<TwoFactorConfig>('TWO_FACTOR_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultTwoFactorConfig()
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
            const parent: TwoFactorConfig = inject(TWO_FACTOR_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultTwoFactorConfig();
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}