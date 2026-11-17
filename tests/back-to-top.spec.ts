import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom doesn't scroll and has no layout.
describe('back to top in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('shows once the top is out of sight, goes back to it, and leaves the next Tab at the start of the page', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
        await StorybookUtilities.renderStory(page, 'ui-back-to-top--default');
        const button: Locator = page.getByRole('button', { name: 'Back to top' });
        expect(await button.count()).toBe(0);

        await page.mouse.wheel(0, 2000);
        await expect.poll(() => button.isVisible()).toBe(true);
        // in the bottom end corner, round by the radius of floating buttons
        expect(await button.boundingBox()).toMatchObject({ x: 1024 - 16 - 48, y: 768 - 16 - 48 });
        expect(await button.evaluate(element => getComputedStyle(element).borderRadius)).toBe('9999px');

        await button.click();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
        await expect.poll(() => button.count()).toBe(0);
        await page.keyboard.press('Tab');
        expect(await page.getByRole('link', { name: 'Start of the page' }).evaluate(element => element === document.activeElement)).toBe(true);
    });

    test('keeps an element the focus scrolls into view clear of itself', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
        await StorybookUtilities.renderStory(page, 'ui-back-to-top--default');

        expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom)).toBe('80px');
    });
});