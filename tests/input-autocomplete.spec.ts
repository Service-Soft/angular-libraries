import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because the keyboard of the combobox is the point and jsdom has no focus to move.
describe('input autocomplete in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('filters by the text, moves through the options with the arrow keys and chooses one with Enter', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-autocomplete--playground');
        const input: Locator = page.getByRole('combobox', { name: 'City' });

        await input.pressSequentially('ha');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('true');
        // the list follows every keystroke, so it is read once it settled
        await expect.poll(async () => (await page.getByRole('option').allTextContents()).map(text => text.trim())).toEqual(['Hamburg', 'Hannover']);

        // typing makes the first option the active one. Focus stays in the input, the active option is its active
        // descendant, and the list wraps around at its end
        await expect.poll(async () => await page.locator(`[id="${await input.getAttribute('aria-activedescendant') ?? ''}"]`).textContent()).toContain('Hamburg');
        await input.press('ArrowDown');
        await expect.poll(async () => await page.locator(`[id="${await input.getAttribute('aria-activedescendant') ?? ''}"]`).textContent()).toContain('Hannover');
        await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('combobox');

        await input.press('Enter');
        await expect.poll(() => input.inputValue()).toBe('Hannover');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');
        expect(await page.getByText('Value: HAJ').count()).toBe(1);
        await page.close();
    });

    test('closes the list with Escape, and when focus leaves it', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-autocomplete--playground');
        const input: Locator = page.getByRole('combobox', { name: 'City' });

        await input.pressSequentially('b');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('true');
        await input.press('Escape');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');

        await input.press('ArrowDown');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('true');
        await page.keyboard.press('Tab');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');
        await page.close();
    });

    test('shows no list, not even an empty one, while no option contains the text', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-autocomplete--playground');
        const input: Locator = page.getByRole('combobox', { name: 'City' });

        await input.pressSequentially('Paris');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');
        expect(await page.getByRole('listbox').count()).toBe(0);

        await input.fill('');
        await input.pressSequentially('Ber');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('true');
        await page.close();
    });

    test('opens the list once the options of a backend arrive, after the user stopped typing', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-autocomplete--backend-search');
        const input: Locator = page.getByRole('combobox', { name: 'City' });

        await input.pressSequentially('ham');
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('true');
        await page.getByRole('option', { name: 'Hamburg' }).click();
        await expect.poll(() => input.inputValue()).toBe('Hamburg');
        // choosing closes it, and the options of the chosen text don't open it again
        await expect.poll(() => input.getAttribute('aria-expanded')).toBe('false');
        await page.close();
    });
});