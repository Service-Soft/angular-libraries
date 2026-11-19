import { Browser, BrowserContext, chromium, Locator, Page, Route } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

/**
 * A request that reached the api of the test.
 */
type ApiRequest = {
    method: string,
    path: string,
    body: unknown
};

// takes the network away or gives it back. The emulation of playwright changes navigator.onLine but fires no event,
// which a browser does when its real connection changes, so the test fires it.
async function setConnection(context: BrowserContext, page: Page, online: boolean): Promise<void> {
    await context.setOffline(!online);
    await page.evaluate(eventType => window.dispatchEvent(new Event(eventType)), online ? 'online' : 'offline');
}

// a real browser, because jsdom has no network to lose, no modal dialogs and no focus handling.
describe('offline status bar and sync dialog in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('says when the connection is lost, and syncs the changes made offline once it is back', async () => {
        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'pwa-offline-status-bar--unsaved-changes');
        // the api of the app, answering like a server
        const received: ApiRequest[] = [];
        await page.route('**/api/**', async (route: Route) => {
            const method: string = route.request().method();
            // postDataJSON is null for a request without a body
            const body: unknown = route.request().postDataJSON() ?? undefined;
            received.push({ method, path: new URL(route.request().url()).pathname, body });
            await route.fulfill({ json: method === 'POST' ? { id: 1, title: 'Buy milk' } : {} });
        });
        const status: Locator = page.getByRole('status').first();
        expect(await status.textContent()).toContain('Unsaved changes');

        await setConnection(context, page, false);
        await expect.poll(() => status.textContent()).toContain('Offline');
        await setConnection(context, page, true);
        await expect.poll(() => status.textContent()).toContain('Unsaved changes');

        await page.getByRole('button', { name: 'Sync (2)' }).click();
        const dialog: Locator = page.getByRole('dialog', { name: 'Unsaved changes' });
        await expect.poll(() => dialog.isVisible()).toBe(true);
        // focus starts on the first change, whose buttons say which change they are for
        const firstSync: Locator = dialog.getByRole('button', { name: 'Sync', exact: true }).first();
        expect(await firstSync.evaluate(element => element === document.activeElement)).toBe(true);
        expect(await firstSync.getAttribute('aria-describedby')).toBeTruthy();
        expect(await page.locator(`#${await firstSync.getAttribute('aria-describedby')}`).textContent()).toContain('Buy milk');

        await dialog.getByRole('button', { name: 'Sync all' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(false);
        expect(received).toEqual<ApiRequest[]>([
            { method: 'POST', path: '/api/todos', body: { title: 'Buy milk' } },
            { method: 'DELETE', path: '/api/todos/3', body: undefined }
        ]);
        await expect.poll(() => page.locator('ui-snackbar').textContent()).toContain('Every change is synced.');
        // nothing is left to say
        expect((await status.textContent())?.trim()).toBe('');
        await context.close();
    });

    test('keeps what was loaded in IndexedDB, and shows it after a reload without the server, saying how old it is', async () => {
        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();
        // the api of the story, on an origin of its own
        await page.route('https://api.storybook.test/**', async (route: Route) => await route.fulfill({ json: ['Buy milk', 'Pay rent'] }));
        await StorybookUtilities.renderStory(page, 'pwa-offline-status-bar--with-offline-cache');
        await expect.poll(() => page.getByRole('listitem').allTextContents()).toEqual(['Buy milk', 'Pay rent']);
        const status: Locator = page.getByRole('status').first();
        expect((await status.textContent())?.trim()).toBe('');
        // an answer of a query nobody asks again, loaded longer ago than the default maxAgeInMs of 7 days
        await page.evaluate(async () => {
            const database: IDBDatabase = await new Promise((resolve, reject) => {
                const opening: IDBOpenDBRequest = indexedDB.open('ngx-pwa-offline-cache');
                opening.addEventListener('success', () => resolve(opening.result));
                opening.addEventListener('error', () => reject(opening.error ?? new Error('IndexedDB refused.')));
            });
            const loadedAt: string = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString();
            await new Promise((resolve, reject) => {
                const store: IDBObjectStore = database.transaction('answers', 'readwrite').objectStore('answers');
                const saving: IDBRequest = store.put({ key: 'old', body: [], loadedAt });
                saving.addEventListener('success', resolve);
                saving.addEventListener('error', () => reject(saving.error ?? new Error('IndexedDB refused.')));
            });
            database.close();
        });

        await page.unrouteAll();
        await page.route('https://api.storybook.test/**', async (route: Route) => await route.abort());
        await StorybookUtilities.renderStory(page, 'pwa-offline-status-bar--with-offline-cache');
        await expect.poll(() => page.getByRole('listitem').allTextContents()).toEqual(['Buy milk', 'Pay rent']);
        expect(await status.textContent()).toMatch(/Offline\s+· Data from /);
        // deleted when the cache opened again, without anybody asking for it
        const keys: unknown[] = await page.evaluate(async () => await new Promise<unknown[]>((resolve, reject) => {
            const opening: IDBOpenDBRequest = indexedDB.open('ngx-pwa-offline-cache');
            opening.addEventListener('success', () => {
                const store: IDBObjectStore = opening.result.transaction('answers').objectStore('answers');
                const reading: IDBRequest<IDBValidKey[]> = store.getAllKeys();
                reading.addEventListener('success', () => resolve(reading.result));
                reading.addEventListener('error', () => reject(reading.error ?? new Error('IndexedDB refused.')));
            });
            opening.addEventListener('error', () => reject(opening.error ?? new Error('IndexedDB refused.')));
        }));
        expect(keys).toHaveLength(1);
        expect(keys).not.toContain('old');
        await context.close();
    });

    test('the sync dialog fits a 320px wide screen without scrolling sideways', async () => {
        const context: BrowserContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'pwa-sync-dialog--default');
        const dialog: Locator = page.getByRole('dialog', { name: 'Unsaved changes' });
        await expect.poll(() => dialog.isVisible()).toBe(true);

        const overflow: number = await dialog.evaluate(element => element.scrollWidth - element.clientWidth);
        expect(overflow).toBe(0);
        await context.close();
    });
});