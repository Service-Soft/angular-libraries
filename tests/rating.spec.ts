import { Browser, chromium, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

// a real browser, because jsdom lays nothing out: the width RatingUtilities calculates has to end where the stars do.
describe('rating in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('fills the stars up to the value, a part of the last one as well, also from right to left', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-rating--playground');

        // how much of each empty star, from the first one on, the filled stars cover, in tenths
        const findCovered: () => Promise<number[]> = async () => await page.locator('ui-rating [role="img"]').evaluate(image => {
            const filled: DOMRect | undefined = image.children[1]?.getBoundingClientRect();
            const stars: DOMRect[] = [...image.children[0]?.querySelectorAll('svg') ?? []].map(star => star.getBoundingClientRect());
            return stars.map(star => {
                const covered: number = Math.min(star.right, filled?.right ?? 0) - Math.max(star.left, filled?.left ?? 0);
                return Math.round(Math.max(0, covered) / star.width * 10) / 10;
            });
        });
        expect(await findCovered()).toEqual([1, 1, 1, 1, 0.4]);

        await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
        expect(await findCovered()).toEqual([1, 1, 1, 1, 0.4]);
        await page.close();
    });
});