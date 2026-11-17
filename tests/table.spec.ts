import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

async function findBackground(locator: Locator): Promise<string> {
    return await locator.evaluate(element => getComputedStyle(element).backgroundColor);
}

// a real browser, because the layout on a phone is css and jsdom lays nothing out.
describe('table in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('orders by a column with the keyboard, and says the order on its header', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-table--plain');
        const header: Locator = page.getByRole('columnheader', { name: 'Orders' });

        await header.getByRole('button').focus();
        await page.keyboard.press('Enter');
        await expect.poll(() => header.getAttribute('aria-sort')).toBe('ascending');
        await page.keyboard.press('Enter');
        await expect.poll(() => header.getAttribute('aria-sort')).toBe('descending');
        expect(await page.getByRole('row').nth(1)
            .getByRole('cell')
            .nth(2)
            .textContent()).toContain('29');
        await page.close();
    });

    test('opens a row by a click on it, but not by a click on its checkbox or its actions', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-table--default');
        const row: Locator = page.getByRole('row').filter({ hasText: 'Alan Turing 1' });

        await row.getByRole('checkbox').check();
        await row.getByRole('button', { name: 'Delete' }).click();
        // the story's own status, after the one of the table that says which rows the page shows
        const said: Locator = page.getByRole('status').last();
        await expect.poll(() => said.textContent()).toContain('Deleted Alan Turing 1.');

        await row.getByRole('cell', { name: /Hamburg/ }).click();
        await expect.poll(() => said.textContent()).toContain('Opened Alan Turing 1.');
        await page.close();
    });

    test('says which rows the page shows, and keeps the first of them in view when the page size changes', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-table--default');
        const range: Locator = page.locator('ui-table-footer').getByRole('status');

        // 10 rows a page by default
        await page.getByRole('button', { name: 'Page 2' }).click();
        await expect.poll(() => range.textContent()).toBe('Showing 11–20 of 23');

        // a click on the visible label focuses the select, like on the label of any field
        await page.getByText('Rows per page', { exact: true }).click();
        const pageSize: Locator = page.getByRole('combobox', { name: 'Rows per page' });
        await expect.poll(() => pageSize.evaluate(element => element === document.activeElement)).toBe(true);
        await pageSize.click();
        // the 11th row is on the first page of 25, which holds every row, so there is no pagination anymore
        await page.getByRole('option', { name: '25', exact: true }).click();
        await expect.poll(() => range.textContent()).toBe('Showing 1–23 of 23');
        expect(await page.locator('ui-table tbody tr').count()).toBe(23);
        expect(await page.locator('ui-table nav').count()).toBe(0);
        await page.close();
    });

    test('shows every row as a card of its values on a phone, each after the label of its column', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 400, height: 800 } });
        await StorybookUtilities.renderStory(page, 'ui-table--default');
        const row: Locator = page.getByRole('row').filter({ hasText: 'Alan Turing 1' });

        expect(await row.evaluate(element => getComputedStyle(element).display)).toBe('block');
        expect(await row.getByText('City', { exact: true }).isVisible()).toBe(true);
        // only the columns to order or filter by are in the header, the others are already next to every value
        expect(await page.getByRole('columnheader', { name: 'Actions' }).isVisible()).toBe(false);
        expect(await page.getByRole('columnheader', { name: 'Status' }).first()
            .isVisible()).toBe(true);
        expect(await page.getByRole('columnheader', { name: 'Name' }).first()
            .isVisible()).toBe(true);
        // and the page doesn't scroll sideways, also with a filter open
        await page.getByRole('button', { name: 'Filter Name' }).click();
        expect(await page.getByRole('searchbox', { name: 'Filter Name' }).isVisible()).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(400);
        await page.close();
    });

    test('filters in a popover of the header, which closes once the user is done, and says what it filters by', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-table--default');
        const search: Locator = page.getByRole('searchbox', { name: 'Filter Name' });
        const status: Locator = page.getByRole('combobox', { name: 'Filter Status' });

        // the popover focuses its input, so the user can type right away
        await page.getByRole('button', { name: 'Filter Name' }).click();
        await page.keyboard.type('grace');
        expect(await search.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Enter');
        await expect.poll(() => search.isVisible()).toBe(false);
        expect(await page.getByRole('row').filter({ hasText: 'Alan Turing' })
            .count()).toBe(0);

        // the select of ui, which the popover focuses as well, and choosing one of its options closes both
        await page.getByRole('button', { name: 'Filter Status' }).click();
        await expect.poll(() => status.evaluate(element => element === document.activeElement)).toBe(true);
        await status.click();
        await page.getByRole('option', { name: 'Paused' }).click();
        await expect.poll(() => status.isVisible()).toBe(false);
        const badges: Locator = page.getByRole('list', { name: 'Filters' }).getByRole('button');
        await expect.poll(() => badges.allTextContents()).toEqual([' Name: grace ', ' Status: Paused ']);

        // a click on a badge removes its filter, which brings back the paused customers of every name
        await page.getByRole('button', { name: 'Remove filter Name: grace' }).click();
        await expect.poll(() => badges.count()).toBe(1);
        expect(await page.getByRole('row').filter({ hasText: 'Ada Lovelace' })
            .count()).toBeGreaterThan(0);
        await page.close();
    });

    test('takes its header, footer and stripes from the table tokens, and is framed by its variant', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-table--striped');
        const tables: Locator = page.locator('ui-table');
        const outlined: Locator = tables.nth(0);
        const rows: Locator = outlined.locator('tbody tr');

        const header: string = await findBackground(outlined.locator('thead'));
        expect(header).not.toBe(await findBackground(page.locator('body')));
        expect(await findBackground(outlined.locator('ui-pagination').locator('..'))).toBe(header);
        // every second row is set apart, and a row that opens still shows its hover over the stripe
        const plain: string = await findBackground(rows.nth(0));
        const stripe: string = await findBackground(rows.nth(1));
        expect(stripe).not.toBe(plain);
        expect(await findBackground(rows.nth(3))).toBe(stripe);
        await rows.nth(1).hover();
        await expect.poll(() => findBackground(rows.nth(1))).toBe(header);

        expect(await outlined.evaluate(element => getComputedStyle(element).borderTopWidth)).toBe('1px');
        expect(await tables.nth(1).evaluate(element => getComputedStyle(element).borderTopWidth)).toBe('0px');
        expect(await tables.nth(2).evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
        await page.close();
    });

    test('a local table goes on with the selected rows of every page, like marking them as paid', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-local-table--default');
        // the story's own status, after the one of the table that says which rows the page shows
        const status: Locator = page.getByRole('status').last();

        // a row's text has the label of each column before its value, which only shows on a phone
        await page.getByRole('row').filter({ hasText: 'NumberA-1Customer' })
            .getByRole('checkbox')
            .check();
        await page.getByRole('button', { name: 'Page 2' }).click();
        await page.getByRole('row').filter({ hasText: 'NumberA-13Customer' })
            .getByRole('checkbox')
            .check();
        await expect.poll(() => status.textContent()).toContain('2 selected');

        // A-13 wasn't paid yet, and stays selected once it is
        await page.getByRole('button', { name: 'Mark as paid' }).click();
        await expect.poll(() => page.getByRole('row').filter({ hasText: 'NumberA-13Customer' })
            .textContent()).toContain('PaidYes');
        expect(await status.textContent()).toContain('2 selected');
        await page.getByRole('button', { name: 'Delete selected' }).click();
        await expect.poll(() => status.textContent()).toContain('15 orders, 0 selected');
        await page.close();
    });

    test('a local table orders formatted dates by their values, not their texts', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-local-table--default');

        await page.getByRole('button', { name: 'Date' }).click();
        // as texts, 'Apr …' would come first
        expect(await page.getByRole('row').nth(1)
            .textContent()).toContain('Jan 1, 2026');
        await page.close();
    });

    test('a local table goes to the page before once the rows of the last one are deleted', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-local-table--default');

        // the last page holds A-11 to A-17, with 10 orders a page
        await page.getByRole('button', { name: 'Page 2' }).click();
        for (let number: number = 17; number >= 11; number--) {
            await page.getByRole('row').filter({ hasText: `NumberA-${number}Customer` })
                .getByRole('button', { name: 'Delete' })
                .click();
        }
        await expect.poll(() => page.getByRole('row').filter({ hasText: 'NumberA-10Customer' })
            .count()).toBe(1);
        expect(await page.locator('ui-table-footer').getByRole('status')
            .textContent()).toBe('Showing 1–10 of 10');
        await page.close();
    });
});