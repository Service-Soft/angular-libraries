import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom drops a text that is no number when it is set, instead of keeping it like a browser.
describe('input number in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('keeps a text that is no number yet while the user types, and says it can\'t be read when they leave it', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-input-number--playground');
        const age: Locator = page.getByLabel('Age');
        const value: Locator = page.getByText(/^Value:/);

        // '-' alone is no number, the input reads it as empty until the 5 follows. Waiting for that render in between,
        // which is where the '-' would be deleted.
        await age.selectText();
        await page.keyboard.type('-');
        await expect.poll(() => value.textContent()).toBe('Value: none');
        await page.keyboard.type('5');
        await expect.poll(() => value.textContent()).toBe('Value: -5');

        await age.selectText();
        await page.keyboard.type('-');
        await page.keyboard.press('Tab');
        await expect.poll(() => age.getAttribute('aria-invalid')).toBe('true');
        expect(await value.textContent()).toBe('Value: none');
        // the other match is the invisible copy that keeps the space of the error
        const visibleErrors: Locator = page.getByText('The value can\'t be read.').filter({ visible: true });
        expect(await visibleErrors.count()).toBe(1);
        await page.close();
    });
});