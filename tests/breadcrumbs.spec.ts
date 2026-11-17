import { Browser, chromium, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom has no layout and doesn't apply the css that hides the first arrow.
describe('breadcrumbs in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('puts an arrow between the steps only, and wraps on a narrow screen', async () => {
        const page: Page = await browser.newPage({ viewport: { width: 320, height: 640 } });
        await StorybookUtilities.renderStory(page, 'ui-breadcrumbs--default');

        const arrowsShown: boolean[] = await page.locator('ui-breadcrumb svg').evaluateAll(svgs => {
            return svgs.map(svg => svg.getBoundingClientRect().width > 0);
        });
        expect(arrowsShown).toEqual([false, true, true]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
        await page.close();
    });
});