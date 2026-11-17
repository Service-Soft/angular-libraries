import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because picking a related entity is an autocomplete of @angular/aria, and the tables open dialogs.
// The backend of the stories knows a related entity only by the joinColumn it was sent, so what it answers shows that.
describe('entity relations in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('shows the related entity the read included, and changes it by searching another', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-relations--many-to-one');
        const team: Locator = page.getByRole('combobox', { name: 'Team' });
        await expect.poll(() => team.inputValue()).toBe('Docs');

        await team.fill('des');
        await page.getByRole('option', { name: 'Design' }).click();
        await page.getByRole('button', { name: 'Save' }).click();

        await expect.poll(() => page.getByRole('status').textContent()).toContain('Design');
        await page.close();
    });

    test('creates a task of a project in the table of its tasks, pointing to the project', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'entity-relations--has-many');
        // exact, as the button that deletes the row is named after it as well
        await page.getByRole('button', { name: 'Draw the logo', exact: true }).waitFor();

        await page.getByRole('button', { name: 'Create' }).click();
        const dialog: Locator = page.getByRole('dialog', { name: 'Create' });
        await dialog.getByLabel('Title').fill('Ship the release');
        await expect.poll(() => dialog.getByRole('combobox', { name: 'Project' }).inputValue()).toBe('Website');
        // the list sits in the top layer, so the bottom edge of the dialog doesn't cut its last option off
        await dialog.getByRole('combobox', { name: 'Team' }).fill('d');
        const design: Locator = page.getByRole('option', { name: 'Design' });
        await design.waitFor();
        expect(await design.evaluate(option => {
            const box: DOMRect = option.getBoundingClientRect();
            return document.elementFromPoint(box.x + (box.width / 2), box.y + (box.height / 2)) === option;
        })).toBe(true);
        await dialog.getByRole('combobox', { name: 'Team' }).fill('infra');
        await page.getByRole('option', { name: 'Infrastructure' }).click();
        await dialog.getByRole('button', { name: 'Save' }).click();

        // the table only shows the tasks of the project, with the team the task was created with
        const row: Locator = page.getByRole('row').filter({ hasText: 'Ship the release' });
        await expect.poll(() => row.textContent()).toContain('Infrastructure');
        await page.close();
    });
});