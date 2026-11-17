/**
 * The texts of the dialog, the enrollment and the settings of two factor methods. The texts of each method, like its
 * name, come from provideSecondFactorConfig.
 */
export type TwoFactorLabels = {
    /**
     * The heading of the dialog that asks for a second factor.
     */
    dialogTitle: string,
    /**
     * The button that closes the dialog without a second factor, or ends an enrollment.
     */
    cancel: string,
    /**
     * Says how to enroll an authenticator app.
     */
    scanQrCode: string,
    /**
     * The name of the qr code, which screen readers read.
     */
    qrCode: string,
    /**
     * Shown before the secret, for typing it into the app.
     */
    secret: string,
    /**
     * The label of the input of the phone number, for codes by text message.
     */
    phoneNumber: string,
    /**
     * Says the format of the phone number.
     */
    phoneNumberHint: string,
    /**
     * The button that sends the first code to the phone number.
     */
    sendCode: string,
    /**
     * Says to save the recovery codes.
     */
    saveRecoveryCodes: string,
    /**
     * Says to enter one of the recovery codes, below its input.
     */
    confirmRecoveryCodes: string,
    /**
     * Says what creating a passkey asks of the user.
     */
    createPasskeyMessage: string,
    /**
     * The button that has the device create a passkey.
     */
    createPasskey: string,
    /**
     * The button that completes an enrollment.
     */
    turnOn: string,
    /**
     * The button that starts an enrollment again after it failed.
     */
    retry: string,
    /**
     * The heading of the settings.
     */
    settingsTitle: string,
    /**
     * Shown next to an enrolled method.
     */
    on: string,
    /**
     * Shown next to a method that isn't enrolled.
     */
    off: string,
    /**
     * The button that enrolls a method.
     */
    setUp: string,
    /**
     * The button that enrolls new recovery codes, in place of the ones the user has.
     */
    newRecoveryCodes: string,
    /**
     * The button that removes an enrolled method.
     */
    turnOff: string,
    /**
     * The question before a method is removed.
     */
    turnOffTitle: string,
    /**
     * Says what removing a method does.
     */
    turnOffMessage: string,
    /**
     * Announced once a method was enrolled.
     */
    turnedOn: string,
    /**
     * Announced once a method was removed.
     */
    turnedOff: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * What the dialog, the enrollment and the settings of two factor methods show.
 */
export type TwoFactorConfig = {
    /**
     * The texts.
     */
    labels: TwoFactorLabels
};