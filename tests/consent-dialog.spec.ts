import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no modal dialogs, no focus handling and no layout.
describe('consent dialog in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('has to be answered: escape doesn\'t close it, a button does, and focus returns to where it was', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'tracking-consent-dialog--default');
        const dialog: Locator = page.getByRole('dialog', { name: 'Privacy settings' });
        await expect.poll(() => dialog.isVisible()).toBe(true);

        // focus starts inside, on the heading, so the user reads the text before the choices
        expect(await dialog.getByRole('heading', { name: 'Privacy settings' }).evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        expect(await dialog.isVisible()).toBe(true);

        await dialog.getByRole('button', { name: 'Only required' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(false);

        // the choices show again when the user opens the settings later
        const settings: Locator = page.getByRole('button', { name: 'Privacy settings' });
        await settings.click();
        await expect.poll(() => dialog.isVisible()).toBe(true);
        expect(await dialog.getByRole('checkbox', { name: 'Analytics' }).isChecked()).toBe(false);
        // the trackings of a category only show once it is opened
        expect(await dialog.getByRole('checkbox', { name: 'Shop analytics' }).count()).toBe(0);
        await dialog.locator('summary', { hasText: 'Analytics' }).click();
        expect(await dialog.getByRole('checkbox', { name: 'Shop analytics' }).isChecked()).toBe(false);
        await dialog.getByRole('button', { name: 'Allow all' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(false);
        expect(await settings.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });

    test('fits a 320px wide screen without scrolling sideways', async () => {
        const context: BrowserContext = await browser.newContext({ viewport: { width: 320, height: 640 } });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'tracking-consent-dialog--default');
        const dialog: Locator = page.getByRole('dialog', { name: 'Privacy settings' });
        await expect.poll(() => dialog.isVisible()).toBe(true);

        const overflow: number = await dialog.evaluate(element => element.scrollWidth - element.clientWidth);
        expect(overflow).toBe(0);
        await context.close();
    });
});