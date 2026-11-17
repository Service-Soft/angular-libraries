import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

/**
 * The box of an element on the page.
 */
type Box = {
    /**
     * The distance from the top of the page.
     */
    y: number,
    /**
     * The height.
     */
    height: number,
    /**
     * The width.
     */
    width: number
};

// a real browser, because jsdom has no popovers, no focus to move and no keyboard of the grid.
describe('input date in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function findFocusedLabel(page: Page): Promise<string | null | undefined> {
        return await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    }

    // a year or a month shows its name rather than reading a label
    async function findFocusedText(page: Page): Promise<string | undefined> {
        return await page.evaluate(() => document.activeElement?.textContent?.trim());
    }

    test('opens the calendar below the input on the chosen day, moves with the arrow keys and chooses with Enter', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-date--playground');
        const input: Locator = page.getByRole('textbox', { name: 'Deadline' });
        const button: Locator = page.getByRole('button', { name: 'Choose a date' });
        const calendar: Locator = page.getByRole('dialog', { name: 'Choose a date' });

        await button.click();
        await expect.poll(() => calendar.isVisible()).toBe(true);
        await expect.poll(() => findFocusedLabel(page)).toBe('Thursday, November 12, 2026');
        const inputBox: Box | null = await input.boundingBox();
        const calendarBox: Box | null = await calendar.boundingBox();
        expect(calendarBox?.y).toBeGreaterThanOrEqual((inputBox?.y ?? 0) + (inputBox?.height ?? 0));
        // the input of the story is 20rem wide, where the days fit, so their edges line up
        expect(calendarBox?.width).toBeCloseTo(inputBox?.width ?? 0, 0);

        // the end of a week goes on to the start of the next one
        for (let press: number = 0; press < 4; press++) {
            await page.keyboard.press('ArrowRight');
        }
        await expect.poll(() => findFocusedLabel(page)).toBe('Monday, November 16, 2026');
        await page.keyboard.press('ArrowDown');
        await expect.poll(() => findFocusedLabel(page)).toBe('Monday, November 23, 2026');

        await page.keyboard.press('Enter');
        await expect.poll(() => calendar.isVisible()).toBe(false);
        // the text follows the value with the next render
        await expect.poll(() => input.inputValue()).toBe('11/23/2026');
        expect(await page.getByText('Mon Nov 23 2026', { exact: false }).count()).toBe(1);
        expect(await button.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });

    test('switches the month with its buttons, and closes on Escape without changing the value', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-date--calendar');
        const calendar: Locator = page.getByRole('dialog', { name: 'Choose a date' });
        await expect.poll(() => calendar.isVisible()).toBe(true);

        await page.getByRole('button', { name: 'Next month' }).click();
        await expect.poll(() => calendar.getByText('December 2026').count()).toBe(1);
        await page.getByRole('gridcell', { name: 'Thursday, December 24, 2026' }).click();
        await expect.poll(() => calendar.isVisible()).toBe(false);
        await expect.poll(() => page.getByRole('textbox', { name: 'Delivery' }).inputValue()).toBe('12/24/2026');

        await page.getByRole('button', { name: 'Choose a date' }).click();
        await expect.poll(() => findFocusedLabel(page)).toBe('Thursday, December 24, 2026');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Escape');
        await expect.poll(() => calendar.isVisible()).toBe(false);
        expect(await page.getByRole('textbox', { name: 'Delivery' }).inputValue()).toBe('12/24/2026');
        await page.close();
    });

    test('jumps to a year and a month of it with the keyboard, through the month at the top', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-date--calendar');
        const calendar: Locator = page.getByRole('dialog', { name: 'Choose a date' });
        await expect.poll(() => calendar.isVisible()).toBe(true);

        await page.getByRole('button', { name: 'November 2026, Choose a year' }).click();
        await expect.poll(() => findFocusedText(page)).toBe('2026');
        // four years in a row
        await page.keyboard.press('ArrowDown');
        await expect.poll(() => findFocusedText(page)).toBe('2030');
        await page.keyboard.press('Enter');
        await expect.poll(() => findFocusedText(page)).toBe('November');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Enter');
        // no chosen day and no today in October 2030, so its first day
        await expect.poll(() => findFocusedLabel(page)).toBe('Tuesday, October 1, 2030');
        expect(await calendar.getByText('October 2030').count()).toBe(1);
        await page.close();
    });
});