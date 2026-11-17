import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because the elements move into the drawer by css breakpoints, which jsdom doesn't apply.
describe('navbar in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('moves elements into the drawer the narrower the screen, and closes the drawer once it is empty again', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await StorybookUtilities.renderStory(page, 'navigation-navbar--default');
        const bar: Locator = page.locator('header > nav');
        const menuButton: Locator = page.getByRole('button', { name: 'Open the navigation' });
        const drawer: Locator = page.getByRole('dialog', { name: 'Navigation' });

        for (const name of ['Products', 'Orders', 'Status']) {
            expect(await bar.getByRole('link', { name }).isVisible()).toBe(true);
        }
        expect(await menuButton.isVisible()).toBe(false);

        // below 1280px, the element that collapses on large screens is in the drawer
        await page.setViewportSize({ width: 1100, height: 800 });
        expect(await bar.getByRole('link', { name: 'Status' }).isVisible()).toBe(false);
        expect(await bar.getByRole('link', { name: 'Orders' }).isVisible()).toBe(true);
        await menuButton.click();
        await expect.poll(() => drawer.getByRole('link', { name: 'Status' }).isVisible()).toBe(true);
        expect(await drawer.getByRole('link', { name: 'Orders' }).isVisible()).toBe(false);

        await page.setViewportSize({ width: 1280, height: 800 });
        await expect.poll(() => drawer.isVisible()).toBe(false);
        await page.close();
    });

    test('has everything but the logo and the title in the drawer on a narrow screen, with menus as sections', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 320, height: 640 } });
        await StorybookUtilities.renderStory(page, 'navigation-navbar--default');
        const menuButton: Locator = page.getByRole('button', { name: 'Open the navigation' });
        const drawer: Locator = page.getByRole('dialog', { name: 'Navigation' });

        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
        expect(await page.locator('header > nav').getByRole('link', { name: 'Shop, the start page' })
            .isVisible()).toBe(true);
        await menuButton.click();
        await expect.poll(() => drawer.getByRole('link', { name: 'Products' }).isVisible()).toBe(true);
        expect(await drawer.getByRole('button', { name: 'Log out' }).isVisible()).toBe(true);

        await drawer.getByText('Help').click();
        await drawer.getByText('Contact').click();
        await expect.poll(() => drawer.getByRole('link', { name: 'Write to us' }).isVisible()).toBe(true);

        // following a link leaves the drawer behind, with the focus back at the button that opened it
        await drawer.getByRole('link', { name: 'Products' }).click();
        await expect.poll(() => drawer.isVisible()).toBe(false);
        expect(await page.evaluate(() => location.hash)).toBe('#/products');
        expect(await menuButton.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });

    test('opens a menu of the navbar with its submenu, and follows a link in it', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await StorybookUtilities.renderStory(page, 'navigation-navbar--default');

        await page.getByRole('button', { name: 'Help' }).click();
        await page.getByRole('button', { name: 'Contact' }).click();
        const link: Locator = page.getByRole('link', { name: 'Write to us' });
        await expect.poll(() => link.isVisible()).toBe(true);
        await link.click();

        await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/contact');
        expect(await page.getByRole('link', { name: 'Questions and answers' }).isVisible()).toBe(false);
        await page.close();
    });

    test('links to the sections of the current page', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await StorybookUtilities.renderStory(page, 'navigation-anchors--default');
        const anchors: Locator = page.getByRole('navigation', { name: 'On this page' });

        await expect.poll(() => anchors.getByRole('link').allInnerTexts()).toEqual(['Open', 'Shipped']);
        await page.close();
    });
});