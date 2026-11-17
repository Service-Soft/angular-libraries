import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

/**
 * Where an element is on the page, in pixels.
 */
type Box = {
    left: number,
    right: number,
    bottom: number,
    middle: number
};

async function findBox(locator: Locator): Promise<Box> {
    return await locator.evaluate(element => {
        const rect: DOMRect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, bottom: rect.bottom, middle: rect.top + (rect.height / 2) };
    });
}

// a real browser, because the keyboard of the combobox is the point and jsdom has no focus to move.
describe('input chips in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function findChips(page: Page): Promise<string[]> {
        return (await page.locator('ui-input-chips li span').allTextContents()).map(text => text.trim());
    }

    test('chooses options with the keyboard, keeps the list open for more, and takes a new tag with Enter', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-chips--playground');
        const input: Locator = page.getByRole('combobox', { name: 'Tags' });
        expect(await findChips(page)).toEqual(['Angular', 'Testing']);

        // typing makes the first option the active one, so Enter chooses it, once the list shows it
        await input.pressSequentially('perf');
        await expect.poll(() => input.getAttribute('aria-activedescendant')).toBeTruthy();
        await input.press('Enter');
        await expect.poll(() => findChips(page)).toEqual(['Angular', 'Testing', 'Performance']);
        expect(await input.inputValue()).toBe('');
        expect(await input.getAttribute('aria-expanded')).toBe('true');

        // a chosen option is selected in the list, and Enter on it deselects it
        await input.pressSequentially('ang');
        expect(await page.getByRole('option', { name: 'Angular' }).getAttribute('aria-selected')).toBe('true');
        await input.press('Enter');
        await expect.poll(() => findChips(page)).toEqual(['Testing', 'Performance']);

        await input.pressSequentially('Signals');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');
        await input.press('Enter');
        await expect.poll(() => findChips(page)).toEqual(['Testing', 'Performance', 'signals']);
        await page.close();
    });

    test('removes a chip with its button, which says which chip it removes', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-chips--playground');

        const remove: Locator = page.getByRole('button', { name: 'Remove', description: 'Angular' });
        await remove.click();
        await expect.poll(() => findChips(page)).toEqual(['Testing']);
        // the button is gone, the text next to the chips has the focus
        expect(await page.getByRole('combobox').evaluate(input => input === document.activeElement)).toBe(true);

        // Backspace in the empty text removes the last chip
        await page.keyboard.press('Backspace');
        await expect.poll(() => findChips(page)).toEqual([]);
        await page.close();
    });

    test('shows the chips inside the box of the field, on its first line next to the text', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-chips--playground');
        const input: Locator = page.getByRole('combobox');

        const [box, chip, text] = await Promise.all([
            findBox(input.locator('..')),
            findBox(page.locator('li[ui-input-chip]').first()),
            findBox(input)
        ]);
        expect(chip.left).toBeGreaterThanOrEqual(box.left);
        expect(chip.bottom).toBeLessThanOrEqual(box.bottom);
        expect(text.left).toBeGreaterThan(chip.right);
        // in one line: their middles are at the same height
        expect(Math.abs(text.middle - chip.middle)).toBeLessThan(2);
        await page.close();
    });
});