import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { AccessibilityTreeUtilities } from './accessibility-tree.utilities';
import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no popovers and no anchor positioning.
describe('menu in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('opens below its trigger, closes on choosing an item or escape, and returns focus to the trigger', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-menu--default');
        const trigger: Locator = page.getByRole('button', { name: 'Reset' });
        const item: Locator = page.getByRole('button', { name: 'This change' });

        expect(await AccessibilityTreeUtilities.findExpanded(page, 'Reset')).toBe(false);
        await trigger.click();
        await expect.poll(() => item.isVisible()).toBe(true);
        expect(await AccessibilityTreeUtilities.findExpanded(page, 'Reset')).toBe(true);

        const triggerBox: { x: number, y: number, height: number } | null = await trigger.boundingBox();
        const menuBox: { x: number, y: number } | null = await page.locator('ui-menu').boundingBox();
        // placed at the trigger, not in the middle of the page where the browser puts popovers
        expect(menuBox?.y).toBeGreaterThanOrEqual((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0));
        expect(menuBox?.x).toBe(triggerBox?.x);

        // the items follow the trigger in the tab order
        await page.keyboard.press('Tab');
        expect(await item.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Enter');
        await expect.poll(() => page.getByRole('status').textContent()).toBe('Reset this change.');
        expect(await item.isVisible()).toBe(false);

        await trigger.click();
        await expect.poll(() => item.isVisible()).toBe(true);
        // its click handler is on the element around the button, which a disabled button never sends a click to
        await page.getByRole('button', { name: 'Nothing else' }).click({ force: true });
        expect(await page.getByRole('status').textContent()).toBe('Reset this change.');
        // clicking a disabled button moves the focus to the page in Chromium, so a keyboard user starts at the trigger
        await trigger.focus();
        await page.keyboard.press('Tab');
        expect(await item.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Escape');
        await expect.poll(() => item.isVisible()).toBe(false);
        expect(await trigger.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });

    test('opens a submenu beside its item, and closes every menu on following a link in it', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-menu--with-links-and-a-submenu');
        const trigger: Locator = page.getByRole('button', { name: 'Account' });
        const settings: Locator = page.getByRole('button', { name: 'Settings' });
        const password: Locator = page.getByRole('link', { name: 'Password' });

        await trigger.click();
        await settings.click();
        await expect.poll(() => password.isVisible()).toBe(true);
        expect(await page.getByRole('link', { name: 'Profile' }).isVisible()).toBe(true);
        expect(await AccessibilityTreeUtilities.findExpanded(page, 'Settings')).toBe(true);
        const settingsBox: { x: number, y: number, width: number } | null = await settings.boundingBox();
        const submenuBox: { x: number, y: number } | null = await page.locator('ui-menu ui-menu').boundingBox();
        expect(submenuBox?.x).toBeGreaterThanOrEqual((settingsBox?.x ?? 0) + (settingsBox?.width ?? 0));
        expect(submenuBox?.y).toBe(settingsBox?.y);

        // the links of the submenu follow its item in the tab order, and escape only closes the submenu
        await settings.focus();
        await page.keyboard.press('Tab');
        expect(await password.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Escape');
        await expect.poll(() => password.isVisible()).toBe(false);
        expect(await settings.isVisible()).toBe(true);
        // the submenu gives the focus back after it closed
        await expect.poll(() => settings.evaluate(element => element === document.activeElement)).toBe(true);

        await page.keyboard.press('Enter');
        await expect.poll(() => password.isVisible()).toBe(true);
        await password.click();
        await expect.poll(() => settings.isVisible()).toBe(false);
        expect(await password.isVisible()).toBe(false);
        expect(await page.evaluate(() => location.hash)).toBe('#password');

        // an action in the menu closes it as well, with the focus back at the trigger
        await trigger.click();
        await page.getByRole('button', { name: 'Log out' }).click();
        await expect.poll(() => page.getByRole('status').textContent()).toBe('Logged out.');
        expect(await settings.isVisible()).toBe(false);
        expect(await trigger.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });
});