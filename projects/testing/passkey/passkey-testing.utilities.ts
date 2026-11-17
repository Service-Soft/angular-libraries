import { AddedPasskeyDevice, FakePasskeyDevice } from './fake-passkey-device.model';

/**
 * What the device answers when the browser asks it for a passkey.
 */
type PasskeyAnswer = AuthenticationResponseJSON | RegistrationResponseJSON | undefined;

/**
 * Utilities for testing passkeys in jsdom, which has no WebAuthn.
 */
export abstract class PasskeyTestingUtilities {
    /**
     * Gives the browser a device that answers with the given passkey, in place of the WebAuthn api. The options the page
     * hands the browser come back as they were parsed from, so a test can see the challenge.
     * @param device - What the device answers.
     * @returns The device, with what it was asked and a function that takes it away again.
     */
    static addDevice(device: FakePasskeyDevice): AddedPasskeyDevice {
        const requests: unknown[] = [];
        const creations: unknown[] = [];
        // the request of the autofill waits until the user picks a passkey in it, or the page aborts it
        let pickFromAutofill: (() => void) | undefined;
        const answer: (next: PasskeyAnswer) => Promise<FakePublicKeyCredential> = async next => {
            if (device.cancels === true) {
                throw new DOMException('The user cancelled.', 'NotAllowedError');
            }
            return await Promise.resolve(new FakePublicKeyCredential(next));
        };
        const answerAutofill: (signal: AbortSignal | undefined) => Promise<FakePublicKeyCredential> = async signal => {
            try {
                await new Promise<void>((resolve, reject) => {
                    pickFromAutofill = resolve;
                    signal?.addEventListener('abort', () => reject(new DOMException('The page aborted it.', 'AbortError')));
                });
            }
            finally {
                pickFromAutofill = undefined;
            }
            return await answer(device.assertion);
        };
        FakePublicKeyCredential.autofill = device.autofill === true;
        const credentials: Pick<CredentialsContainer, 'get' | 'create'> = {
            get: async (options?: CredentialRequestOptions) => {
                requests.push(options?.publicKey);
                return options?.mediation === 'conditional' ? await answerAutofill(options.signal) : await answer(device.assertion);
            },
            create: async (options?: CredentialCreationOptions) => {
                creations.push(options?.publicKey);
                return await answer(device.attestation);
            }
        };
        const credentialsDescriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(navigator, 'credentials');
        const classDescriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(globalThis, 'PublicKeyCredential');
        Object.defineProperty(navigator, 'credentials', { configurable: true, value: credentials });
        Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, writable: true, value: FakePublicKeyCredential });
        return {
            requests,
            creations,
            isWaitingInAutofill: () => pickFromAutofill != undefined,
            pickFromAutofill: () => {
                if (pickFromAutofill == undefined) {
                    throw new Error('The page asked for no passkey of the autofill.');
                }
                pickFromAutofill();
            },
            remove: () => {
                PasskeyTestingUtilities.restore(navigator, 'credentials', credentialsDescriptor);
                PasskeyTestingUtilities.restore(globalThis, 'PublicKeyCredential', classDescriptor);
            }
        };
    }

    private static restore(target: object, key: string, descriptor: PropertyDescriptor | undefined): void {
        if (descriptor == undefined) {
            Reflect.deleteProperty(target, key);
            return;
        }
        Object.defineProperty(target, key, descriptor);
    }
}

/**
 * A credential of the fake device, which the page tells apart from anything else with instanceof PublicKeyCredential,
 * as the device takes its place in the browser.
 */
class FakePublicKeyCredential implements Credential {
    /**
     * Whether the browser offers passkeys in the autofill of an input, which the device says.
     */
    static autofill: boolean = false;

    /**
     * The id of the credential.
     */
    readonly id: string = 'fake-passkey';

    /**
     * The type of every passkey.
     */
    readonly type: string = 'public-key';

    constructor(private readonly answer: PasskeyAnswer) {}

    /**
     * Hands the options back as the page gave them, so a test sees them.
     * @param options - The options of a request to use a passkey.
     * @returns The same options.
     */
    static parseRequestOptionsFromJSON(options: unknown): unknown {
        return options;
    }

    /**
     * Hands the options back as the page gave them, so a test sees them.
     * @param options - The options of a request to create a passkey.
     * @returns The same options.
     */
    static parseCreationOptionsFromJSON(options: unknown): unknown {
        return options;
    }

    /**
     * Says whether the browser offers passkeys in the autofill of an input.
     * @returns What the device says.
     */
    static async isConditionalMediationAvailable(): Promise<boolean> {
        return await Promise.resolve(this.autofill);
    }

    /**
     * Gets the answer of the device, as a real credential gives it as json.
     * @returns The answer.
     */
    toJSON(): PasskeyAnswer {
        return this.answer;
    }
}