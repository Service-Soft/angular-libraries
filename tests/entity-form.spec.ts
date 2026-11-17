import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because which field gets focus, and whether the browser can focus it at all, is the point.
describe('entity form in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('opens the tab of the first invalid field on save and focuses it', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-form--create');

        await page.getByLabel('Name').fill('Website');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect.poll(() => page.getByRole('tab', { name: 'Schedule' }).getAttribute('aria-selected')).toBe('true');
        await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[role="tabpanel"]')
            ?.querySelector('label')?.textContent?.trim())).toContain('Starts');
        expect(await page.getByRole('status').textContent()).not.toContain('Saved.');
        await page.close();
    });

    test('saves once every field on every tab is valid, and asks for the review a public project needs', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-form--create');
        await page.getByLabel('Name').fill('Website');
        await page.getByRole('tab', { name: 'Schedule' }).click();
        await page.getByLabel('Starts').fill('03/01/2026');
        await page.getByLabel('Ends').fill('06/30/2026');
        const reviewed: Locator = page.getByLabel('Reviewed by legal');

        await page.getByRole('switch', { name: 'Public' }).check();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => reviewed.evaluate(element => element === document.activeElement)).toBe(true);

        await reviewed.check();
        await page.getByRole('button', { name: 'Save' }).click();
        // the fields of an inline object are on the last tab
        await expect.poll(() => page.getByRole('tab', { name: 'Location' }).getAttribute('aria-selected')).toBe('true');
        // exact, as the optional second site is a group too
        await page.getByRole('group', { name: 'Site', exact: true }).getByLabel('Street')
            .fill('Elm street 2');
        await page.getByRole('group', { name: 'Site', exact: true }).getByLabel('City')
            .fill('Munich');
        await page.getByRole('combobox', { name: 'Office' }).click();
        await page.getByRole('option', { name: 'Hamburg', exact: true }).click();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => page.getByRole('status').textContent()).toContain('Saved.');
        await page.close();
    });
});