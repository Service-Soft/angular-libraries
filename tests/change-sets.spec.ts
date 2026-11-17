import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no dialogs, popovers, focus handling or layout.
describe('change sets in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function isFocused(locator: Locator): Promise<boolean> {
        return await locator.evaluate(element => element === document.activeElement);
    }

    test('rolls back after confirming, and keeps focus on the page whether the user confirmed or not', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'change-sets-change-sets--default');
        // the second newest, as rolling back to the newest would change nothing
        const secondNewest: Locator = page.locator('details').nth(1);
        const dialog: Locator = page.getByRole('dialog', { name: 'Rollback to the state after this change set?' });
        expect(await page.locator('details').count()).toBe(7);

        await secondNewest.locator('summary').click();
        const reset: Locator = secondNewest.getByRole('button', { name: 'Reset', exact: true });
        await reset.click();
        await page.getByRole('button', { name: 'Rollback all to this state' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(true);

        // the menu closed before the dialog opened, so the dialog returns focus to its trigger, not to the hidden item
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect.poll(() => dialog.count()).toBe(0);
        expect(await isFocused(reset)).toBe(true);
        expect(await page.locator('details').count()).toBe(7);

        await reset.click();
        await page.getByRole('button', { name: 'Rollback all to this state' }).click();
        await dialog.getByRole('button', { name: 'Rollback' }).click();
        // the newest one is gone, and the one rolled back to is kept
        await expect.poll(() => page.locator('details').count()).toBe(6);
        // the menu may be gone, so focus moves to the newest change set that is left
        expect(await isFocused(page.locator('summary').first())).toBe(true);
        await page.close();
    });

    test('shows more change sets and moves focus to the first new one', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'change-sets-change-sets--long-history');
        expect(await page.locator('details').count()).toBe(10);

        await page.getByRole('button', { name: 'Show more' }).click();
        await expect.poll(() => page.locator('details').count()).toBe(20);
        // the focus moves after the render that shows them, which can come a frame after the count
        await expect.poll(() => isFocused(page.locator('summary').nth(10))).toBe(true);
        await page.close();
    });

    test('fits a 320px wide screen without scrolling sideways', async () => {
        const context: BrowserContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'change-sets-change-sets--default');
        for (const summary of await page.locator('summary').all()) {
            await summary.click();
        }

        const overflow: number = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBe(0);
        await context.close();
    });
});