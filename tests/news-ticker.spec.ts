import { Browser, chromium, Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StorybookUtilities } from './storybook.utilities';

/**
 * How the list of the headlines moves, as the browser computed it.
 */
type TrackState = {
    animation: string,
    playState: string,
    wrap: string,
    duration: string,
    width: number,
    tickerWidth: number
};

async function findTrackState(track: Locator): Promise<TrackState> {
    return await track.evaluate((element: HTMLElement) => {
        const style: CSSStyleDeclaration = getComputedStyle(element);
        return {
            animation: style.animationName,
            playState: style.animationPlayState,
            wrap: style.flexWrap,
            duration: style.animationDuration,
            // the width the ticker measures, in whole pixels
            width: element.offsetWidth,
            tickerWidth: element.parentElement?.offsetWidth ?? 0
        };
    });
}

// whether a headline is fully inside the ticker, where its overflow doesn't cut it off.
async function isInTicker(headline: Locator): Promise<boolean> {
    return await headline.evaluate(element => {
        const ticker: DOMRect | undefined = element.closest('ul')?.parentElement?.getBoundingClientRect();
        const box: DOMRect = element.getBoundingClientRect();
        return ticker != undefined && box.left >= ticker.left && box.right <= ticker.right;
    });
}

// a real browser, because the ticker moves by css and measures its own width, and jsdom has neither.
describe('news ticker in the browser', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('moves every headline at the same speed, from the end of the ticker out at its start', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-news-ticker--default');
        const track: Locator = page.locator('ui-news-ticker ul');

        // the list starts as far after the start as the ticker is wide, and takes as long as its width at 50px a second
        await expect.poll(async () => {
            const state: TrackState = await findTrackState(track);
            return state.duration === `${state.width / 50}s` && state.width > state.tickerWidth;
        }).toBe(true);
        expect((await findTrackState(track)).animation).toBe('news-ticker');

        // a single headline is a shorter way, so it takes less time at the same speed
        const short: Page = await browser.newPage();
        await StorybookUtilities.renderStory(short, 'ui-news-ticker--one-headline');
        const shortTrack: Locator = short.locator('ui-news-ticker ul');
        await expect.poll(async () => (await findTrackState(shortTrack)).duration).not.toBe('30s');
        expect(Number.parseFloat((await findTrackState(shortTrack)).duration)).toBeLessThan(Number.parseFloat((await findTrackState(track)).duration));
        await page.close();
        await short.close();
    });

    test('stops on hover and with its button, which says what it does', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-news-ticker--default');
        const track: Locator = page.locator('ui-news-ticker ul');

        await page.locator('ui-news-ticker section > div').hover();
        expect((await findTrackState(track)).playState).toBe('paused');
        await page.mouse.move(0, 0);
        expect((await findTrackState(track)).playState).toBe('running');

        await page.getByRole('button', { name: 'Pause news' }).click();
        await page.mouse.move(0, 0);
        expect((await findTrackState(track)).playState).toBe('paused');
        await page.getByRole('button', { name: 'Play news' }).click();
        await page.mouse.move(0, 0);
        expect((await findTrackState(track)).playState).toBe('running');
        await page.close();
    });

    test('stands still and wraps while the keyboard is on a headline, and moves again once it left them', async () => {
        const page: Page = await browser.newPage();
        await StorybookUtilities.renderStory(page, 'ui-news-ticker--default');
        const track: Locator = page.locator('ui-news-ticker ul');

        await page.keyboard.press('Tab');
        await expect.poll(async () => (await findTrackState(track)).animation).toBe('none');
        expect((await findTrackState(track)).wrap).toBe('wrap');
        // every headline is in view, the last one too
        expect(await isInTicker(page.getByRole('link', { name: 'General assembly on March 3' }))).toBe(true);

        // through the other headlines it stays still, from the last one on to the button it moves again
        for (let index: number = 0; index < 3; index++) {
            await page.keyboard.press('Tab');
            expect((await findTrackState(track)).animation).toBe('none');
        }
        await page.keyboard.press('Tab');
        await expect.poll(async () => (await findTrackState(track)).animation).toBe('news-ticker');
        expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Pause news');
        await page.close();
    });

    test('keeps moving when a headline is clicked, which only the keyboard stops', async () => {
        const page: Page = await browser.newPage();
        // fast enough that the first headline is in view after a second
        await StorybookUtilities.renderStory(page, 'ui-news-ticker--default&args=speed:500');
        const track: Locator = page.locator('ui-news-ticker ul');
        const link: Locator = page.getByRole('link', { name: 'Summer party on July 12' });
        await expect.poll(() => isInTicker(link)).toBe(true);

        // hovering stops it, so the link stays under the pointer until the click
        await page.locator('ui-news-ticker section > div').hover({ position: { x: 1, y: 1 } });
        const center: { x: number, y: number } = await link.evaluate(element => {
            const box: DOMRect = element.getBoundingClientRect();
            return { x: box.left + (box.width / 2), y: box.top + (box.height / 2) };
        });
        await page.mouse.click(center.x, center.y);
        expect(await page.evaluate(() => document.activeElement?.textContent.trim())).toBe('Summer party on July 12');
        expect((await findTrackState(track)).animation).toBe('news-ticker');
        await page.close();
    });

    test('stands still and wraps when the user prefers reduced motion, without the button to stop it', async () => {
        const page: Page = await browser.newPage({ reducedMotion: 'reduce' });
        await StorybookUtilities.renderStory(page, 'ui-news-ticker--default');
        const track: Locator = page.locator('ui-news-ticker ul');

        expect((await findTrackState(track)).animation).toBe('none');
        expect((await findTrackState(track)).wrap).toBe('wrap');
        expect(await page.getByRole('button', { name: 'Pause news' }).isVisible()).toBe(false);
        await page.close();
    });
});