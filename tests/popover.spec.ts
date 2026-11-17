import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { AccessibilityTreeUtilities } from './accessibility-tree.utilities';
import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no popovers and no anchor positioning.
describe('popover in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('opens below its trigger, stays open while used, closes on escape and returns focus to the trigger', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-popover--default');
        // its name changes with the selection
        const trigger: Locator = page.locator('button[popovertarget]');
        const website: Locator = page.getByRole('checkbox', { name: 'Website' });

        expect(await AccessibilityTreeUtilities.findExpanded(page, 'Applications: Api')).toBe(false);
        await trigger.click();
        await expect.poll(() => website.isVisible()).toBe(true);
        expect(await AccessibilityTreeUtilities.findExpanded(page, 'Applications: Api')).toBe(true);

        const triggerBox: { x: number, y: number, height: number } | null = await trigger.boundingBox();
        const popoverBox: { x: number, y: number } | null = await page.locator('ui-popover').boundingBox();
        // placed at the trigger, not in the middle of the page where the browser puts popovers
        expect(popoverBox?.y).toBeGreaterThanOrEqual((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0));
        expect(popoverBox?.x).toBe(triggerBox?.x);

        // its content follows the trigger in the tab order, and using it keeps the popover open
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        expect(await website.evaluate(element => element === document.activeElement)).toBe(true);
        await page.keyboard.press('Space');
        expect(await website.isChecked()).toBe(true);
        expect(await website.isVisible()).toBe(true);
        await expect.poll(() => trigger.textContent()).toContain('Applications: Api, Website');

        await page.keyboard.press('Escape');
        await expect.poll(() => website.isVisible()).toBe(false);
        expect(await trigger.evaluate(element => element === document.activeElement)).toBe(true);
        await page.close();
    });

    test('closes on a click outside of it', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-popover--open');
        const website: Locator = page.getByRole('checkbox', { name: 'Website' });
        await expect.poll(() => website.isVisible()).toBe(true);

        await page.mouse.click(600, 400);
        await expect.poll(() => website.isVisible()).toBe(false);
        await page.close();
    });
});