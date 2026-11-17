import { Base64UrlUtilities } from './base64-url.utilities';

// 32 bytes are the 43 characters RFC 7636 asks a verifier to have at least.
const VERIFIER_BYTES: number = 32;

/**
 * Utilities for PKCE, which binds a login handed over by code to the browser that started it: the browser keeps a
 * random verifier, and sends its challenge first.
 */
export abstract class PkceUtilities {
    /**
     * Creates a random verifier.
     * @returns The verifier, base64url encoded.
     */
    static createVerifier(): string {
        return Base64UrlUtilities.encode(crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)));
    }

    /**
     * Resolves the challenge of a verifier: its SHA-256, base64url encoded, as S256 asks.
     * @param verifier - The verifier.
     * @returns The challenge.
     */
    static async resolveChallenge(verifier: string): Promise<string> {
        const hash: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
        return Base64UrlUtilities.encode(new Uint8Array(hash));
    }
}