import { AxeBuilder } from '@axe-core/playwright';
import { AxeResults } from 'axe-core';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { StoryIndexEntry } from './story-index-entry.model';
import { StorybookUtilities } from './storybook.utilities';
import { PAGE_LEVEL_RULES } from '../projects/ui/.storybook/page-level-rules';

/**
 * A story and the color scheme of the operating system it gets checked in.
 */
type StoryCheck = StoryIndexEntry & {
    /**
     * The color scheme the browser reports, which the tokens follow.
     */
    colorScheme: 'light' | 'dark'
};

// every story, or the part of them a CI job checks, like ACCESSIBILITY_SHARD=2/4
const STORY_CHECKS: StoryCheck[] = StorybookUtilities.findStoriesOfShard(process.env['ACCESSIBILITY_SHARD'])
    .flatMap(entry => [{ ...entry, colorScheme: 'light' }, { ...entry, colorScheme: 'dark' }]);

describe('accessibility', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    // the same checks as the accessibility panel of storybook: everything except storybook's own elements.
    test.for(STORY_CHECKS)('$title: $name passes all AXE checks in $colorScheme mode', async check => {
        const context: BrowserContext = await browser.newContext({ colorScheme: check.colorScheme });
        const page: Page = await context.newPage();
        await StorybookUtilities.renderStory(page, check.id);
        const results: AxeResults = await new AxeBuilder({ page })
            .exclude(['.sb-wrapper', '#storybook-docs', '#storybook-highlights-root'])
            .disableRules(PAGE_LEVEL_RULES)
            .analyze();
        await context.close();
        const violations: string[] = results.violations.flatMap(violation => violation.nodes.map(node => {
            return `${violation.id} on ${node.target.join(' ')}: ${node.failureSummary}`;
        }));
        expect(violations).toEqual([]);
    });
});