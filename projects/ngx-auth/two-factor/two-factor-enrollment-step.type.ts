/**
 * Where an enrollment stands: asking for the phone number of codes by text message, waiting for zibri, asking for the
 * first code, asking the device to create a passkey, or offering to start again after zibri refused to start.
 */
export type TwoFactorEnrollmentStep = 'phoneNumber' | 'requesting' | 'confirming' | 'passkey' | 'failed';