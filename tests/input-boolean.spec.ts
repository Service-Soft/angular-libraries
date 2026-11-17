import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no layout to measure.
describe('input boolean in the browser', () => {
    let browser: Browser;
    let context: BrowserContext;

    beforeAll(async () => {
        browser = await chromium.launch();
        // without the slide of the message row, so every position is final once it rendered.
        context = await browser.newContext({ reducedMotion: 'reduce' });
    });

    afterAll(async () => {
        await browser.close();
    });

    async function findBottom(locator: Locator): Promise<number> {
        return locator.evaluate(element => element.getBoundingClientRect().bottom);
    }

    // the box of the text itself, without the padding of the element around it.
    async function findTextTop(locator: Locator): Promise<number> {
        return locator.evaluate(element => {
            const range: Range = document.createRange();
            range.selectNodeContents(element);
            return range.getBoundingClientRect().top;
        });
    }

    async function findTextBottom(locator: Locator): Promise<number> {
        return locator.evaluate(element => {
            const range: Range = document.createRange();
            range.selectNodeContents(element);
            return range.getBoundingClientRect().bottom;
        });
    }

    test('shows its error as close below the text of the label as a text input below its input', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-string--validation');
        const email: Locator = page.getByRole('textbox', { name: 'Email' });
        const emailError: Locator = page.locator('ui-input-string').filter({ has: email })
            .locator('p.text-error');
        const stringGap: number = await findTextTop(emailError) - await findBottom(email);

        await StorybookUtilities.renderStory(page, 'ui-input-boolean--validation');
        for (const name of ['I accept the terms', 'Keep me logged in']) {
            const host: Locator = page.locator('ui-input-boolean').filter({ hasText: name });
            const gap: number = await findTextTop(host.locator('p.text-error')) - await findTextBottom(host.locator('label'));
            // the text of a label has the half leading of its line around it, an input has none below its border.
            expect(gap).toBeGreaterThanOrEqual(stringGap - 4);
            expect(gap).toBeLessThanOrEqual(stringGap + 4);
        }
        await page.close();
    });

    test('is as high as an input of the same size without hint and error', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-boolean--sizes');
        const heights: number[] = await page.locator('ui-input-boolean').evaluateAll(hosts => hosts.map(host => host.getBoundingClientRect().height));
        expect(heights).toEqual([32, 32, 40, 40, 48, 48]);
        await page.close();
    });

    test('colors the border of an invalid checkbox, not a ring around it', async () => {
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-boolean--validation');
        const checkbox: Locator = page.getByRole('checkbox', { name: 'I accept the terms' });
        const switchControl: Locator = page.getByRole('switch', { name: 'Keep me logged in' });

        const style: { borderColor: string, outlineStyle: string } = await checkbox.evaluate(element => ({
            borderColor: getComputedStyle(element).borderTopColor,
            outlineStyle: getComputedStyle(element).outlineStyle
        }));
        expect(style.outlineStyle).toBe('none');
        expect(style.borderColor).toBe(await switchControl.evaluate(element => getComputedStyle(element).borderTopColor));
        await page.close();
    });
});