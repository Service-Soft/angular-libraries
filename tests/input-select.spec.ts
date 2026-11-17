import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no hover, cursor or keyboard of the combobox.
describe('input select in the browser', () => {
    let browser: Browser;
    let context: BrowserContext;

    beforeAll(async () => {
        browser = await chromium.launch();
        context = await browser.newContext({ reducedMotion: 'reduce' });
    });

    afterAll(async () => {
        await browser.close();
    });

    async function findStyle(locator: Locator, property: 'cursor' | 'backgroundColor'): Promise<string> {
        return locator.evaluate((element, name) => getComputedStyle(element)[name], property);
    }

    test('shows the pointer on the select and its options, and hovers an option in the color of the theme', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-select--states');
        const chosen: Locator = page.getByRole('combobox', { name: 'Chosen' });
        // the background of a read only input is the same token the hover of an option uses
        const themeHover: string = await findStyle(page.getByRole('combobox', { name: 'Read only' }), 'backgroundColor');
        expect(await findStyle(chosen, 'cursor')).toBe('pointer');

        await chosen.click();
        const small: Locator = page.getByRole('option', { name: 'Small' });
        expect(await findStyle(small, 'cursor')).toBe('pointer');
        await small.hover();
        expect(await findStyle(small, 'backgroundColor')).toBe(themeHover);
        await page.close();
    });

    async function findActiveOption(page: Page, combobox: Locator): Promise<string | undefined> {
        const id: string | null = await combobox.getAttribute('aria-activedescendant');
        return id == undefined ? undefined : (await page.locator(`#${id}`).textContent())?.trim();
    }

    async function isFocused(locator: Locator): Promise<boolean> {
        return locator.evaluate(element => element === document.activeElement);
    }

    test('opens with the keyboard on the chosen option, moves by arrows and letters, and chooses with Enter', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-select--states');
        const chosen: Locator = page.getByRole('combobox', { name: 'Chosen' });

        await chosen.focus();
        await page.keyboard.press('Enter');
        await expect.poll(() => chosen.getAttribute('aria-expanded')).toBe('true');
        expect(await findActiveOption(page, chosen)).toBe('Medium');

        await page.keyboard.press('ArrowUp');
        await expect.poll(() => findActiveOption(page, chosen)).toBe('Small');
        await page.keyboard.type('l');
        await expect.poll(() => findActiveOption(page, chosen)).toBe('Large');
        await page.keyboard.press('Enter');
        await expect.poll(() => chosen.getAttribute('aria-expanded')).toBe('false');
        expect(await chosen.textContent()).toContain('Large');
        expect(await isFocused(chosen)).toBe(true);
        await page.close();
    });

    test('closes when the chosen option is chosen again, and keeps focus after a click', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-select--states');
        const chosen: Locator = page.getByRole('combobox', { name: 'Chosen' });

        await chosen.focus();
        await page.keyboard.press('Enter');
        await expect.poll(() => findActiveOption(page, chosen)).toBe('Medium');
        await page.keyboard.press('Enter');
        await expect.poll(() => chosen.getAttribute('aria-expanded')).toBe('false');
        expect(await chosen.textContent()).toContain('Medium');

        await chosen.click();
        await page.getByRole('option', { name: 'Medium' }).click();
        await expect.poll(() => chosen.getAttribute('aria-expanded')).toBe('false');
        expect(await chosen.textContent()).toContain('Medium');
        expect(await isFocused(chosen)).toBe(true);
        await page.close();
    });

    test('neither hovers, moves to nor chooses a disabled option', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-select--states');
        const chosen: Locator = page.getByRole('combobox', { name: 'Chosen' });

        await chosen.click();
        const disabled: Locator = page.getByRole('option', { name: 'Extra large' });
        await disabled.hover();
        expect(await findStyle(disabled, 'backgroundColor')).toBe('rgba(0, 0, 0, 0)');
        await disabled.click({ force: true });
        expect(await disabled.getAttribute('data-active')).not.toBe('true');
        expect(await chosen.getAttribute('aria-expanded')).toBe('true');

        // the last option is the disabled one, so the keyboard stops at the one before it
        await page.keyboard.press('End');
        await expect.poll(() => findActiveOption(page, chosen)).toBe('Large');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect.poll(() => chosen.getAttribute('aria-expanded')).toBe('false');
        expect(await chosen.textContent()).toContain('Large');
        await page.close();
    });

    test('can not be opened while read only', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-select--states');
        const readonly: Locator = page.getByRole('combobox', { name: 'Read only' });

        await readonly.click();
        expect(await readonly.getAttribute('aria-expanded')).toBe('false');
        expect(await findStyle(readonly, 'cursor')).toBe('default');
        await page.close();
    });
});