import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no showModal, no top layer, no focus handling of dialogs and no layout.
describe('drawer in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    async function isFocused(locator: Locator): Promise<boolean> {
        return await locator.evaluate(element => element === document.activeElement);
    }

    test('slides in at the start, takes the focus, and closes on escape, a click next to it or a followed link', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
        await StorybookUtilities.renderStory(page, 'ui-drawer--default');
        const trigger: Locator = page.getByRole('button', { name: 'Open the navigation' });
        const drawer: Locator = page.getByRole('dialog', { name: 'Navigation' });

        await trigger.click();
        await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0);
        expect((await drawer.boundingBox())?.height).toBe(768);
        expect(await isFocused(drawer.getByRole('link', { name: 'Home' }))).toBe(true);
        await page.keyboard.press('Escape');
        await expect.poll(() => drawer.isVisible()).toBe(false);
        expect(await isFocused(trigger)).toBe(true);

        await trigger.click();
        await expect.poll(() => drawer.isVisible()).toBe(true);
        // the page behind it is inert, so the click lands on the backdrop
        await page.mouse.click(1000, 400);
        await expect.poll(() => drawer.isVisible()).toBe(false);

        await trigger.click();
        await drawer.getByRole('link', { name: 'Orders' }).click();
        await expect.poll(() => drawer.isVisible()).toBe(false);
        await page.close();
    });

    test('slides in at the end and leaves a strip of a narrow screen visible, without scrolling sideways', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 320, height: 640 } });
        await StorybookUtilities.renderStory(page, 'ui-drawer--open-at-the-end');
        const drawer: Locator = page.getByRole('dialog', { name: 'Navigation' });

        await expect.poll(async () => {
            const box: { x: number, width: number } | null = await drawer.boundingBox();
            return box == undefined ? undefined : box.x + box.width;
        }).toBe(320);
        expect((await drawer.boundingBox())?.width).toBeLessThan(320);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
        await page.close();
    });
});