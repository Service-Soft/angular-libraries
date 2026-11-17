import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no showModal, no top layer and no focus handling of dialogs.
describe('dialog in the browser', () => {
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

    test('opens in the middle of the screen', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
        await StorybookUtilities.renderStory(page, 'ui-dialog--opened-from-code');

        await page.getByRole('button', { name: 'Delete order' }).click();
        const { x, y, width, height } = await page.getByRole('dialog').boundingBox() ?? { x: 0, y: 0, width: 0, height: 0 };
        // its middle is the middle of the screen
        expect(Math.round(x + (width / 2))).toBe(500);
        expect(Math.round(y + (height / 2))).toBe(400);
        await page.close();
    });

    test('opens a component from code, labelled by its heading, and resolves with the answer', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-dialog--opened-from-code');
        const trigger: Locator = page.getByRole('button', { name: 'Delete order' });
        const dialog: Locator = page.getByRole('dialog', { name: 'Delete the order?' });

        await trigger.click();
        await expect.poll(() => dialog.isVisible()).toBe(true);
        // cancel first, so enter right away never deletes anything
        expect(await isFocused(dialog.getByRole('button', { name: 'Cancel' }))).toBe(true);

        await page.keyboard.press('Escape');
        await expect.poll(() => page.getByRole('status').textContent()).toBe('Kept.');
        expect(await page.locator('dialog').count()).toBe(0);
        expect(await isFocused(trigger)).toBe(true);

        await trigger.click();
        await dialog.getByRole('button', { name: 'Delete' }).click();
        await expect.poll(() => page.getByRole('status').textContent()).toBe('Deleted.');
        expect(await page.locator('dialog').count()).toBe(0);
        await page.close();
    });

    test('stays open on escape while closeOnEscape is false', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-dialog--without-escape');
        const dialog: Locator = page.getByRole('dialog', { name: 'Which language do you prefer?' });

        await page.getByRole('button', { name: 'Choose a language' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(true);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        expect(await dialog.isVisible()).toBe(true);

        await dialog.getByRole('button', { name: 'Deutsch' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(false);
        await page.close();
    });

    test('opens a dialog of the template, which a form with method dialog closes', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-dialog--in-the-template');
        const dialog: Locator = page.getByRole('dialog', { name: 'Newsletter' });

        await page.getByRole('button', { name: 'Subscribe' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(true);
        await dialog.getByRole('button', { name: 'Got it' }).click();
        await expect.poll(() => dialog.isVisible()).toBe(false);
        await page.close();
    });
});