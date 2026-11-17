import { HttpHeaders } from '@angular/common/http';
import { Service } from '@angular/core';

import { Base64UrlUtilities } from './base64-url.utilities';

// where the key is kept, which a reload and the other tabs of the app find again.
const DATABASE_NAME: string = 'ngx-auth';
const STORE_NAME: string = 'dpop';
const KEY_NAME: string = 'key';

// the header zibri answers a new nonce in.
const NONCE_HEADER: string = 'DPoP-Nonce';

// ES256, which every browser signs with and zibri takes.
const KEY_ALGORITHM: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_ALGORITHM: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

/**
 * Proves with every request of a jwt login that this browser holds the key its tokens are bound to (DPoP, RFC 9449),
 * so stolen tokens are of no use anywhere else. The key is a non-extractable WebCrypto key in IndexedDB: the app signs
 * with it, but no script can read it, and it never leaves the browser. Without IndexedDB, it is kept as long as the
 * page. A new login gets a new key. The interceptor uses it while provideAuth has `dpop: true`.
 */
@Service()
export class DpopService {
    private keyPair: Promise<CryptoKeyPair> | undefined;

    // zibri's nonces are good for any request until they expire, so the last one it answered is the one to sign with.
    private nonce: string | undefined;

    /**
     * Resolves the proof of a request, the value of its `DPoP` header: a jwt of the method and the url, signed with
     * the key, with the hash of the access token it sends and the last nonce of zibri.
     * @param method - The method of the request.
     * @param url - The absolute url of the request, whose query and fragment the proof leaves out.
     * @param accessToken - The access token the request sends, if any.
     * @returns The proof.
     */
    async resolveProof(method: string, url: string, accessToken?: string): Promise<string> {
        const { privateKey, publicKey } = await this.resolveKeyPair();
        const { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', publicKey);
        const target: URL = new URL(url);
        const payload: Record<string, string | number> = {
            jti: crypto.randomUUID(),
            htm: method,
            htu: `${target.origin}${target.pathname}`,
            iat: Math.floor(Date.now() / 1000)
        };
        if (accessToken != undefined) {
            payload['ath'] = Base64UrlUtilities.encode(new Uint8Array(await crypto.subtle.digest('SHA-256', this.encode(accessToken))));
        }
        if (this.nonce != undefined) {
            payload['nonce'] = this.nonce;
        }
        const input: string = `${this.encodeJson({ typ: 'dpop+jwt', alg: 'ES256', jwk: { kty, crv, x, y } })}.${this.encodeJson(payload)}`;
        const signature: ArrayBuffer = await crypto.subtle.sign(SIGN_ALGORITHM, privateKey, this.encode(input));
        return `${input}.${Base64UrlUtilities.encode(new Uint8Array(signature))}`;
    }

    /**
     * Keeps the nonce zibri answered with, if it answered one, for the next proofs.
     * @param headers - The headers of the answer.
     * @returns Whether it answered a new nonce.
     */
    readNonce(headers: HttpHeaders): boolean {
        const nonce: string | null = headers.get(NONCE_HEADER);
        if (nonce == undefined || nonce === this.nonce) {
            return false;
        }
        this.nonce = nonce;
        return true;
    }

    /**
     * Forgets the key, like once the login ended, so the next login is bound to a new one.
     */
    async forgetKey(): Promise<void> {
        this.keyPair = undefined;
        this.nonce = undefined;
        const database: IDBDatabase | undefined = await this.openDatabase();
        if (database == undefined) {
            return;
        }
        await this.request(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
            .delete(KEY_NAME));
        database.close();
    }

    private async resolveKeyPair(): Promise<CryptoKeyPair> {
        // the browser only has WebCrypto in a secure context, which every site on https is
        if (typeof crypto === 'undefined' || typeof crypto.subtle === 'undefined') {
            throw new Error('DPoP needs WebCrypto, which the browser only offers on https and localhost.');
        }
        this.keyPair ??= this.resolveStoredKeyPair();
        return await this.keyPair;
    }

    // the key of an earlier visit, or a new one, kept for the next.
    private async resolveStoredKeyPair(): Promise<CryptoKeyPair> {
        const database: IDBDatabase | undefined = await this.openDatabase();
        if (database == undefined) {
            return await crypto.subtle.generateKey(KEY_ALGORITHM, false, ['sign', 'verify']);
        }
        try {
            const stored: unknown = await this.request(database.transaction(STORE_NAME).objectStore(STORE_NAME)
                .get(KEY_NAME));
            if (this.isKeyPair(stored)) {
                return stored;
            }
            // not extractable: the private key can sign, but no script can read it
            const created: CryptoKeyPair = await crypto.subtle.generateKey(KEY_ALGORITHM, false, ['sign', 'verify']);
            await this.request(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
                .put(created, KEY_NAME));
            return created;
        }
        finally {
            database.close();
        }
    }

    private async openDatabase(version?: number): Promise<IDBDatabase | undefined> {
        if (typeof indexedDB === 'undefined') {
            return undefined;
        }
        const opening: IDBOpenDBRequest = indexedDB.open(DATABASE_NAME, version);
        opening.addEventListener('upgradeneeded', () => {
            if (!opening.result.objectStoreNames.contains(STORE_NAME)) {
                opening.result.createObjectStore(STORE_NAME);
            }
        });
        const database: IDBDatabase = await this.request(opening);
        // a database of that name without the store, like one another script created: only an upgrade adds it
        if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.close();
            return await this.openDatabase(database.version + 1);
        }
        return database;
    }

    private async request<T>(request: IDBRequest<T>): Promise<T> {
        return await new Promise((resolve, reject) => {
            request.addEventListener('success', () => resolve(request.result));
            request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB refused the request.')));
        });
    }

    // a structured clone of a key pair keeps its CryptoKeys, also non-extractable ones.
    private isKeyPair(value: unknown): value is CryptoKeyPair {
        return typeof value === 'object' && value != undefined
            && Reflect.get(value, 'privateKey') instanceof CryptoKey && Reflect.get(value, 'publicKey') instanceof CryptoKey;
    }

    private encodeJson(value: object): string {
        return Base64UrlUtilities.encode(this.encode(JSON.stringify(value)));
    }

    private encode(text: string): Uint8Array<ArrayBuffer> {
        return new TextEncoder().encode(text);
    }
}