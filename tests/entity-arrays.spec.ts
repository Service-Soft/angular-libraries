import { AxeBuilder } from '@axe-core/playwright';
import { AxeResults } from 'axe-core';
import { Browser, BrowserContext, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';
import { PAGE_LEVEL_RULES } from '../projects/ui/.storybook/page-level-rules';

// a real browser, because the dialog of an item is a modal one, and where the focus goes is the point.
describe('entity arrays in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('adds an object in a dialog, which passes AXE, and shows it in the table', async () => {
        // AXE needs a context of its own
        const context: BrowserContext = await browser.newContext();
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, 'entity-arrays--empty');

        await page.getByRole('group', { name: 'Speakers' }).getByRole('button', { name: 'Add' })
            .click();
        const dialog: Locator = page.getByRole('dialog', { name: 'Add to Speakers' });
        await dialog.getByLabel('Name').fill('Ada Lovelace');
        const results: AxeResults = await new AxeBuilder({ page }).include('dialog[open]')
            .disableRules(PAGE_LEVEL_RULES)
            .analyze();
        expect(results.violations).toEqual([]);

        await dialog.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => dialog.count()).toBe(0);
        await expect.poll(() => page.getByRole('group', { name: 'Speakers' }).getByRole('table')
            .textContent()).toContain('Ada Lovelace');
        await context.close();
    });

    test('moves the focus of a submit to the button that adds an item, while a required array has none', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-arrays--empty');
        // the required days come first
        await page.getByLabel('Days').fill('Mon');
        await page.getByRole('option', { name: 'Monday' }).click();

        await page.getByRole('button', { name: 'Save' }).click();
        const add: Locator = page.getByRole('group', { name: 'Speakers' }).getByRole('button', { name: 'Add' });
        await expect.poll(() => add.evaluate(element => element === document.activeElement)).toBe(true);
        // the error renders after the focus moved
        await expect.poll(() => add.getAttribute('aria-describedby')).not.toBeNull();
        await page.close();
    });
});