import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

async function findRect(locator: Locator): Promise<DOMRect> {
    return await locator.evaluate(element => element.getBoundingClientRect().toJSON() as DOMRect);
}

async function findMiddle(locator: Locator): Promise<number> {
    const rect: DOMRect = await findRect(locator);
    return (rect.top + rect.bottom) / 2;
}

// a real browser, because only there the browser itself validates on submit and fires the invalid events, with its
// own timing in between them. jsdom only imitates it.
describe('form in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('blocks an invalid submit, shows every error and focuses the first invalid input, then submits once valid', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-form--default');
        const name: Locator = page.getByLabel('Name');
        const submit: Locator = page.getByRole('button', { name: 'Sign up' });

        await submit.click();
        await expect.poll(() => name.evaluate(input => input === document.activeElement)).toBe(true);
        // angular renders the errors after the event
        await expect.poll(() => name.getAttribute('aria-invalid')).toBe('true');
        await expect.poll(() => page.getByLabel('Email').getAttribute('aria-invalid')).toBe('true');
        expect(await page.getByRole('status').count()).toBe(0);

        await name.fill('Jane');
        await page.getByLabel('Email').fill('jane@example.com');
        // exact: the button next to it is called "Show password"
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('long enough');
        await submit.click();
        await expect.poll(() => page.getByRole('status').textContent()).toBe('Signed up Jane.');
        await page.close();
    });

    test('lines up a slider, chosen chips, a chosen file, and a checkbox and a switch aligned with inputs, with a text next to them', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-form--aligned');
        const forms: Locator[] = await page.locator('ui-aligned-form').all();

        const offsets: number[] = [];
        for (const form of forms) {
            const controls: Locator[] = [
                form.getByRole('slider'),
                form.locator('ui-input-chips').getByRole('combobox'),
                // in the middle of the box of the file
                form.locator('ui-input-file').getByRole('button', { name: 'Remove' }),
                form.getByRole('checkbox'),
                form.getByRole('switch')
            ];
            for (const control of controls) {
                // the text in the same row of the grid is the one right before the control
                const text: Locator = control.locator('xpath=ancestor::*[starts-with(local-name(), "ui-input-")][last()]')
                    .locator('xpath=preceding-sibling::ui-input-string[1]')
                    .getByRole('textbox');
                offsets.push(Math.round(await findMiddle(control) - await findMiddle(text)));
            }
        }
        // five controls in each of the three sizes
        expect(offsets).toEqual(Array.from({ length: 15 }, () => 0));
        await page.close();
    });

    test('grows a textarea that spans two rows from the top of the text next to it to the bottom of the one below', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-form--aligned');
        const forms: Locator[] = await page.locator('ui-aligned-form').all();

        const offsets: number[] = [];
        for (const form of forms) {
            const textarea: Locator = form.locator('ui-input-textarea');
            const textareaBox: DOMRect = await findRect(textarea.locator('textarea'));
            const above: DOMRect = await findRect(textarea.locator('xpath=preceding-sibling::ui-input-string[1]').getByRole('textbox'));
            const below: DOMRect = await findRect(textarea.locator('xpath=following-sibling::ui-input-string[1]').getByRole('textbox'));
            offsets.push(Math.round(textareaBox.top - above.top), Math.round(textareaBox.bottom - below.bottom));
        }
        expect(offsets).toEqual([0, 0, 0, 0, 0, 0]);
        await page.close();
    });
});