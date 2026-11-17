import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because the dialogs are modal native dialogs, which jsdom only pretends to open.
describe('entity table in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('creates a task in a dialog, which then shows in the table', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-table--editable');
        // exact names, as the button that deletes a row is named after it as well
        await page.getByRole('button', { name: 'Write the docs 1', exact: true }).waitFor();

        await page.getByRole('button', { name: 'Create' }).click();
        const dialog: Locator = page.getByRole('dialog', { name: 'Create' });
        await dialog.getByLabel('Title').fill('Ship the release');
        await dialog.getByRole('combobox', { name: 'Status' }).click();
        await dialog.getByRole('option', { name: 'Open', exact: true }).click();
        await dialog.getByLabel('Hours').fill('3');
        await dialog.getByLabel('Due').fill('12/01/2026');
        await dialog.getByRole('button', { name: 'Save' }).click();

        await expect.poll(() => dialog.count()).toBe(0);
        await expect.poll(() => page.getByRole('button', { name: 'Ship the release', exact: true }).count()).toBe(1);
        await page.close();
    });

    test('creates and edits a task on pages of their own, and goes back to the table after saving', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-table--editable-on-pages');
        await page.getByRole('button', { name: 'Write the docs 1', exact: true }).waitFor();

        await page.getByRole('button', { name: 'Create' }).click();
        await page.getByRole('heading', { level: 1, name: 'New task' }).waitFor();
        expect(page.url()).toContain('#/tasks/new');
        await page.getByLabel('Title').fill('Ship the release');
        await page.getByRole('combobox', { name: 'Status' }).click();
        await page.getByRole('option', { name: 'Open', exact: true }).click();
        await page.getByLabel('Hours').fill('3');
        await page.getByLabel('Due').fill('12/01/2026');
        await page.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => page.getByRole('button', { name: 'Ship the release', exact: true }).count()).toBe(1);

        // the page of a task loads it into the form
        await page.getByRole('button', { name: 'Write the docs 1', exact: true }).click();
        await page.getByRole('heading', { level: 1, name: 'Edit task' }).waitFor();
        expect(page.url()).toContain('#/tasks/task-1');
        const title: Locator = page.getByLabel('Title');
        await expect.poll(() => title.inputValue()).toBe('Write the docs 1');
        await title.fill('Write the README');
        await page.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => page.getByRole('button', { name: 'Write the README', exact: true }).count()).toBe(1);
        await page.close();
    });

    test('edits a task in a dialog that keeps the changes until the user discards them', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-table--editable');

        await page.getByRole('button', { name: 'Write the docs 1', exact: true }).click();
        const dialog: Locator = page.getByRole('dialog', { name: 'Edit' });
        await dialog.getByLabel('Title').fill('Write the README');
        // escape asks nothing and loses nothing: the dialog stays
        await page.keyboard.press('Escape');
        expect(await dialog.isVisible()).toBe(true);

        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await page.getByRole('dialog', { name: 'Discard your changes?' }).getByRole('button', { name: 'Keep editing' })
            .click();
        await dialog.getByRole('button', { name: 'Save' }).click();
        await expect.poll(() => page.getByRole('button', { name: 'Write the README', exact: true }).count()).toBe(1);
        await page.close();
    });

    test('deletes a task after asking', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-table--editable');

        await page.getByRole('button', { name: 'Delete Write the docs 1' }).click();
        await page.getByRole('dialog', { name: 'Delete this?' }).getByRole('button', { name: 'Delete' })
            .click();
        await expect.poll(() => page.getByRole('button', { name: 'Write the docs 1', exact: true }).count()).toBe(0);
        await page.close();
    });

    test('exports the selected tasks as a csv the browser saves, with the texts of the table', async () => {
        const page: Page = await browser.newPage({ acceptDownloads: true });
        await StorybookUtilities.renderStory(page, 'entity-table--selectable');
        await page.locator('tbody input[type="checkbox"]').first()
            .check();

        const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export as CSV' }).click()]);
        const stream: NodeJS.ReadableStream = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const lines: string[] = Buffer.concat(chunks).toString('utf8')
            .split('\r\n');
        expect(download.suggestedFilename()).toBe('export.csv');
        expect(lines[0]).toBe('Title,Status,Hours,Billable,Due');
        expect(lines).toHaveLength(2);
        await page.close();
    });

    test('imports the tasks of a json file, which then show in the table', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-table--editable');
        await page.getByRole('button', { name: 'Write the docs 1', exact: true }).waitFor();

        await page.locator('input[type="file"]').setInputFiles({
            name: 'tasks.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify([{ title: 'Imported task', status: 'open', hours: 1, billable: false, dueAt: '2026-12-01T00:00:00.000Z' }]))
        });
        await expect.poll(() => page.getByRole('button', { name: 'Imported task', exact: true }).count()).toBe(1);
        await page.close();
    });
});