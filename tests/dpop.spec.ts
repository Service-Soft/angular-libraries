import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

/**
 * The key of the browser in IndexedDB, as far as a test can look at it.
 */
type StoredKey = {
    /**
     * The public key, which every proof carries.
     */
    publicKey: JsonWebKey,
    /**
     * Whether a script can read the private key.
     */
    extractable: boolean,
    /**
     * Whether exporting the private key was refused.
     */
    exportRefused: boolean
};

// reads the key the login stored, the way any script of the page could try.
async function findStoredKey(page: Page): Promise<StoredKey | undefined> {
    return await page.evaluate(async () => {
        // opening a database that doesn't exist yet would create it, without the store of the app
        if (!(await indexedDB.databases()).some(info => info.name === 'ngx-auth')) {
            return undefined;
        }
        const database: IDBDatabase = await new Promise((resolve, reject) => {
            const opening: IDBOpenDBRequest = indexedDB.open('ngx-auth');
            opening.addEventListener('success', () => resolve(opening.result));
            opening.addEventListener('error', () => reject(opening.error ?? new Error('IndexedDB refused.')));
        });
        if (!database.objectStoreNames.contains('dpop')) {
            return undefined;
        }
        const stored: unknown = await new Promise((resolve, reject) => {
            const reading: IDBRequest<unknown> = database.transaction('dpop').objectStore('dpop')
                .get('key');
            reading.addEventListener('success', () => resolve(reading.result));
            reading.addEventListener('error', () => reject(reading.error ?? new Error('IndexedDB refused.')));
        });
        if (typeof stored !== 'object' || stored == undefined || !('privateKey' in stored) || !('publicKey' in stored)) {
            return undefined;
        }
        const { privateKey, publicKey } = stored;
        if (!(privateKey instanceof CryptoKey) || !(publicKey instanceof CryptoKey)) {
            return undefined;
        }
        const exportRefused: boolean = await crypto.subtle.exportKey('jwk', privateKey).then(() => false, () => true);
        return { publicKey: await crypto.subtle.exportKey('jwk', publicKey), extractable: privateKey.extractable, exportRefused };
    });
}

// a real browser, because jsdom has no IndexedDB, which keeps the key across visits.
describe('DPoP in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('keeps a key no script can read in IndexedDB, and the same one after a reload logs in again', async () => {
        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();
        // the story logs in once it shows, which signs the first proof and creates the key
        await StorybookUtilities.renderStory(page, 'auth-login--with-dpop');
        await expect.poll(() => findStoredKey(page)).toBeDefined();
        const first: StoredKey | undefined = await findStoredKey(page);
        expect(first?.extractable).toBe(false);
        expect(first?.exportRefused).toBe(true);

        await StorybookUtilities.renderStory(page, 'auth-login--with-dpop');
        await expect.poll(async () => (await findStoredKey(page))?.publicKey).toEqual(first?.publicKey);
        await context.close();
    });
});