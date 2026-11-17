/**
 * How a two factor method is enrolled: an authenticator app scans a qr code, email and text messages send a code,
 * recovery codes are saved by the user, and a passkey is created by their device.
 */
export type TwoFactorEnrollmentKind = 'authenticatorApp' | 'emailCode' | 'smsCode' | 'recoveryCodes' | 'passkey';