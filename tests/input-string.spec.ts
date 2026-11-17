import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no layout to measure.
describe('input string in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function findTop(locator: Locator): Promise<number | undefined> {
        return (await locator.boundingBox())?.y;
    }

    async function findBottom(locator: Locator): Promise<number | undefined> {
        const box: { y: number, height: number } | undefined = await locator.boundingBox() ?? undefined;
        return box == undefined ? undefined : box.y + box.height;
    }

    test('takes no space below the input without hint and error, and keeps the space of an error while it is fixed', async () => {
        // without the slide of the message row, so every position is final once it rendered.
        const context: BrowserContext = await browser.newContext({ reducedMotion: 'reduce' });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-form--default');
        const name: Locator = page.getByLabel('Name');
        const email: Locator = page.getByLabel('Email');
        const nameHost: Locator = page.locator('ui-input-string').filter({ has: name });

        expect(await findBottom(nameHost)).toBe(await findBottom(name));

        await page.getByRole('button', { name: 'Sign up' }).click();
        await expect.poll(() => name.getAttribute('aria-invalid')).toBe('true');
        const emailTop: number | undefined = await findTop(email);
        expect(emailTop).toBeGreaterThan(0);

        await name.fill('Jane');
        await expect.poll(() => name.getAttribute('aria-invalid')).toBeNull();
        expect(await findTop(email)).toBe(emailTop);

        await name.fill('');
        await expect.poll(() => name.getAttribute('aria-invalid')).toBe('true');
        expect(await findTop(email)).toBe(emailTop);
        await context.close();
    });
});