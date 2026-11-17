/**
 * Utilities for base64url, the base64 of urls and headers, without padding.
 */
export abstract class Base64UrlUtilities {
    /**
     * Encodes bytes as base64url.
     * @param bytes - The bytes.
     * @returns The base64url string.
     */
    static encode(bytes: Uint8Array): string {
        return btoa(String.fromCodePoint(...bytes))
            .replaceAll('+', '-')
            .replaceAll('/', '_')
            .replace(/=+$/, '');
    }
}