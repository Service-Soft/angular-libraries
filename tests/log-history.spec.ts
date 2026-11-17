import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no layout and no popovers.
describe('log history in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function resolveOverflow(page: Page): Promise<number> {
        return await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    }

    test('fits a 320px wide screen without scrolling sideways, with the stacks and the filter open', async () => {
        const context: BrowserContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'persistence-logger-log-history--default');
        await page.getByRole('button', { name: 'Critical' }).waitFor();
        for (const summary of await page.locator('summary').all()) {
            await summary.click();
        }
        expect(await resolveOverflow(page)).toBe(0);

        const filter: Locator = page.getByRole('button', { name: 'Applications: All' });
        await filter.click();
        await page.getByRole('checkbox', { name: 'Website' }).waitFor();
        const popover: { x: number, width: number } | null = await page.locator('ui-popover').boundingBox();
        expect((popover?.x ?? 0) + (popover?.width ?? 0)).toBeLessThanOrEqual(320);
        await context.close();
    });

    test('fits the pagination of a page in the middle on a 320px wide screen', async () => {
        const context: BrowserContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'persistence-logger-log-history--many-logs');
        // to page 5, with gaps on both sides
        for (let next: number = 2; next <= 5; next++) {
            await page.getByRole('button', { name: 'Next page' }).click();
            await page.locator(`button[aria-current="page"][aria-label="Page ${next}"]`).waitFor();
        }
        expect(await resolveOverflow(page)).toBe(0);
        await context.close();
    });
});