import { Base64UrlUtilities } from './base64-url.utilities';

/**
 * Utilities for passkeys, with the WebAuthn api of the browser: zibri sends the options as json, and takes the answer
 * of the device as json.
 */
export abstract class PasskeyUtilities {
    /**
     * Has the browser use a passkey, which the user picks and confirms on their device. With the mediation
     * 'conditional', the browser offers the passkeys in the autofill of an input with `autocomplete="username webauthn"`
     * instead of a dialog, and the request waits until the user picks one there, or the signal aborts it.
     * @param options - The options zibri answered with, like the challenge.
     * @param mediation - How the browser asks, a dialog by default.
     * @param signal - Aborts the request, like a waiting one of the autofill before a dialog asks.
     * @returns The answer of the device.
     * @throws {DOMException} A NotAllowedError when the user cancelled or no passkey was used, an AbortError once the
     * signal aborted it.
     */
    static async resolveAssertion(
        options: PublicKeyCredentialRequestOptionsJSON,
        mediation?: CredentialMediationRequirement,
        signal?: AbortSignal
    ): Promise<AuthenticationResponseJSON> {
        const publicKey: PublicKeyCredentialRequestOptions = PublicKeyCredential.parseRequestOptionsFromJSON(options);
        const credential: Credential | null = await navigator.credentials.get({ publicKey, mediation, signal });
        const answer: RegistrationResponseJSON | AuthenticationResponseJSON | undefined = credential instanceof PublicKeyCredential
            ? credential.toJSON()
            : undefined;
        if (answer == undefined || !this.isAssertion(answer)) {
            throw new DOMException('No passkey was used.', 'NotAllowedError');
        }
        return answer;
    }

    /**
     * Resolves whether the browser offers passkeys in the autofill of an input, the mediation 'conditional'.
     * @returns True when it does, false without WebAuthn or the autofill.
     */
    static async isAutofillAvailable(): Promise<boolean> {
        // older browsers have WebAuthn without the autofill, and no function to ask with
        const supported: boolean = typeof PublicKeyCredential !== 'undefined'
            && typeof PublicKeyCredential.isConditionalMediationAvailable === 'function';
        return supported && await PublicKeyCredential.isConditionalMediationAvailable();
    }

    /**
     * Has the browser create a passkey, which the user confirms on their device.
     * @param options - The options zibri answered with, like the challenge and the name of the account.
     * @returns The answer of the device.
     * @throws {DOMException} A NotAllowedError when the user cancelled or no passkey was created.
     */
    static async resolveAttestation(options: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> {
        const publicKey: PublicKeyCredentialCreationOptions = PublicKeyCredential.parseCreationOptionsFromJSON(options);
        const credential: Credential | null = await navigator.credentials.create({ publicKey });
        const answer: RegistrationResponseJSON | AuthenticationResponseJSON | undefined = credential instanceof PublicKeyCredential
            ? credential.toJSON()
            : undefined;
        if (answer == undefined || this.isAssertion(answer)) {
            throw new DOMException('No passkey was created.', 'NotAllowedError');
        }
        return answer;
    }

    /**
     * Encodes the answer of a device as the header of a second factor, base64url encoded json as zibri reads it.
     * @param answer - The answer of the device.
     * @returns The value of the header.
     */
    static encodeSecondFactor(answer: AuthenticationResponseJSON): string {
        return Base64UrlUtilities.encode(new TextEncoder().encode(JSON.stringify(answer)));
    }

    /**
     * Whether the user cancelled using or creating a passkey, or let it time out, which needs no message.
     * @param error - What it failed with.
     * @returns Whether it was cancelled.
     */
    static isCancelled(error: unknown): boolean {
        return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');
    }

    // only the answer to using a passkey is signed; the one to creating it holds the attestation instead
    private static isAssertion(answer: RegistrationResponseJSON | AuthenticationResponseJSON): answer is AuthenticationResponseJSON {
        return 'signature' in answer.response;
    }
}