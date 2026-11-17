import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because the keyboard of the tabs is the point and jsdom has no focus to move.
describe('tabs in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('moves through the tabs with the arrow keys, selecting each, and only focuses a disabled one', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-tabs--default');
        const general: Locator = page.getByRole('tab', { name: 'General' });
        const address: Locator = page.getByRole('tab', { name: 'Address' });

        await general.focus();
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => address.getAttribute('aria-selected')).toBe('true');
        await expect.poll(() => page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Address');
        expect(await page.getByRole('tabpanel').getByLabel('Street')
            .isVisible()).toBe(true);
        expect(await page.getByText('Selected: address').count()).toBe(1);

        // Billing is disabled: it gets focus, so the user learns it is there, but Address stays selected
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Billing');
        expect(await address.getAttribute('aria-selected')).toBe('true');

        // and past the last tab, the first one again
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => general.getAttribute('aria-selected')).toBe('true');
        await page.close();
    });

    test('goes from the selected tab into its panel with Tab', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-tabs--default');

        await page.getByRole('tab', { name: 'General' }).focus();
        await page.keyboard.press('Tab');
        await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[role="tabpanel"]') != undefined)).toBe(true);
        await page.close();
    });
});