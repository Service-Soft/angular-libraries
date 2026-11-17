// @vitest-environment jsdom
// jsdom for its DOMParser, which parses the html of a page without running its scripts.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, test } from 'vitest';

const WEBSITE_PAGE_PATH: string = path.resolve(import.meta.dirname, '../dist/showcase/browser/website/index.html');
const SPECIFICATION_SELECTOR: string = '[itemscope][itemtype="https://schema.org/Dentist"] [itemprop="openingHoursSpecification"][itemtype="https://schema.org/OpeningHoursSpecification"]';
const ANSWER_SELECTOR: string = '[itemprop="acceptedAnswer"][itemtype="https://schema.org/Answer"] [itemprop="text"]';

/**
 * The text of an element as it reads, with the whitespace of the template collapsed.
 * @param element - The element.
 * @returns Its text.
 */
function getText(element: Element | null | undefined): string {
    return (element?.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
}

/**
 * Finds the texts of the elements of a selector.
 * @param root - What to search in.
 * @param selector - The selector of the elements.
 * @returns Their texts, in the order of the page.
 */
function findTexts(root: ParentNode, selector: string): string[] {
    return [...root.querySelectorAll(selector)].map(element => getText(element));
}

// the page of a website in the showcase, which its build renders ahead of time with fixed data. It is read as the html
// file the build writes, without running a script of it: that is what search engines and users see before the browser
// ran anything, and what a component that doesn't work on the server leaves empty or wrong.
describe('prerendered page of a website', () => {
    let website: Document;

    beforeAll(() => {
        website = new DOMParser().parseFromString(readFileSync(WEBSITE_PAGE_PATH, 'utf8'), 'text/html');
    });

    test('has the title of its route and the headings of its sections in their order', () => {
        expect(website.title).toBe('Website');
        expect([...website.querySelectorAll('main :is(h1, h2, h3, h4, h5, h6)')].map(heading => `${heading.tagName} ${getText(heading)}`)).toEqual([
            'H1 Sports club Example',
            'H2 News',
            'H2 Summer party',
            'H3 Sources',
            'H2 Practice',
            'H2 Questions'
        ]);
        // each section is named by its heading, and the ones with an id are the targets of the table of contents
        const sections: HTMLElement[] = [...website.querySelectorAll<HTMLElement>('ui-section > section')];
        expect(sections.map(section => getText(website.getElementById(section.getAttribute('aria-labelledby') ?? ''))))
            .toEqual(['Sports club Example', 'News', 'Practice', 'Questions']);
        expect(sections.map(section => section.id)).toEqual(['', 'news', 'practice', 'questions']);
        expect(findTexts(website, 'ui-section hgroup > p')).toEqual(['Since 1920']);
    });

    test('has the html of a rich text with its headings and lists, without its script', () => {
        const richText: Element | null = website.querySelector('ui-rich-text');
        expect(findTexts(richText ?? website, 'h2')).toEqual(['Summer party']);
        expect(findTexts(richText ?? website, 'p')).toEqual(['The whole club celebrates the end of the season.']);
        expect(findTexts(richText ?? website, 'ul > li')).toEqual(['Barbecue', 'Football for children']);
        expect(richText?.querySelector('script')).toBeNull();
        expect(richText?.innerHTML).not.toContain('injected');
    });

    test('has the opening hours of every day with their microdata, but neither today nor whether it is open now', () => {
        const openingHours: Element | null = website.querySelector('ui-opening-hours');
        // each row is a day, or days with the same hours, with a line for each range and the note
        const rows: string[][] = [...openingHours?.querySelectorAll('tbody > tr') ?? []].map(row => [
            getText(row.querySelector('th[scope="row"]')),
            ...[...row.querySelector('td')?.children ?? []].map(line => getText(line)).filter(line => line !== '')
        ]);
        expect(rows).toEqual([
            ['Monday', '8:00 AM – to 12:00 PM', '2:00 PM – to 6:00 PM'],
            ['Tuesday', 'Closed'],
            ['Wednesday', '8:00 AM – to 12:00 PM'],
            ['Thursday', 'Closed'],
            ['Friday', '8:00 AM – to 1:00 PM', 'Only by appointment'],
            ['Saturday – to Sunday', 'Closed']
        ]);
        // a page built ahead of time would show the day it was built on as today, long after it has passed
        expect(getText(openingHours)).not.toContain('Today');
        expect(getText(openingHours)).not.toContain('Open now');
        expect(getText(openingHours)).not.toContain('Closed now');

        const specifications: Element[] = [...website.querySelectorAll(SPECIFICATION_SELECTOR)];
        expect(specifications.map(specification => [
            specification.querySelector('[itemprop="dayOfWeek"]')?.getAttribute('content'),
            specification.querySelector('[itemprop="opens"]')?.getAttribute('datetime'),
            specification.querySelector('[itemprop="closes"]')?.getAttribute('datetime')
        ])).toEqual([
            ['https://schema.org/Monday', '08:00', '12:00'],
            ['https://schema.org/Monday', '14:00', '18:00'],
            ['https://schema.org/Wednesday', '08:00', '12:00'],
            ['https://schema.org/Friday', '08:00', '13:00']
        ]);
    });

    test('has the final value of a stat, not one it counts up from', () => {
        // the number shows twice, once to keep its width while it counts, and once more for screen readers
        expect([...website.querySelectorAll('ui-stat')].map(stat => findTexts(stat, ':scope > span:first-child > span'))).toEqual([
            ['+1,200', '+1,200', '+1,200'],
            ['98.5 %', '98.5 %', '98.5 %']
        ]);
        expect(findTexts(website, 'ui-stat > span:last-child')).toEqual(['Members', 'Would recommend us']);
    });

    test('has the numbers of the footnotes in the text and their list, linked both ways', () => {
        const references: HTMLAnchorElement[] = [...website.querySelectorAll<HTMLAnchorElement>('ui-footnote a[role="doc-noteref"]')];
        expect(references.map(reference => [getText(reference), reference.getAttribute('href'), reference.id])).toEqual([
            ['1', '/website#sources-note-1', 'sources-ref-1'],
            ['2', '/website#sources-note-2', 'sources-ref-2']
        ]);
        // a reference is read with the text of its footnote
        expect(references.map(reference => getText(website.getElementById(reference.getAttribute('aria-describedby') ?? ''))))
            .toEqual(['Chronicle of the club, page 4.', 'League archive, season 1975.']);

        const notes: HTMLLIElement[] = [...website.querySelectorAll<HTMLLIElement>('ui-footnotes section[aria-label="Sources"] li')];
        expect(notes.map(note => [note.id, note.querySelector('a[role="doc-backlink"]')?.getAttribute('href')])).toEqual([
            ['sources-note-1', '/website#sources-ref-1'],
            ['sources-note-2', '/website#sources-ref-2']
        ]);
    });

    test('has the links of a table of contents given as items, nested and to the path of the page', () => {
        const nav: Element | null = website.querySelector('ui-table-of-contents nav');
        expect(getText(website.getElementById(nav?.getAttribute('aria-labelledby') ?? ''))).toBe('On this page');
        expect([...nav?.querySelectorAll('a') ?? []].map(link => [getText(link), link.getAttribute('href')])).toEqual([
            ['News', '/website#news'],
            ['Summer party', '/website#summer-party'],
            ['Practice', '/website#practice'],
            ['Questions', '/website#questions']
        ]);
        expect(findTexts(nav ?? website, 'ol ol a')).toEqual(['Summer party']);
    });

    test('has the questions and answers of an faq with their microdata, while the answers are closed', () => {
        const page: Element | null = website.querySelector('ui-faq [itemscope][itemtype="https://schema.org/FAQPage"]');
        const questions: Element[] = [...page?.querySelectorAll('[itemprop="mainEntity"][itemtype="https://schema.org/Question"]') ?? []];
        expect(questions.map(question => [getText(question.querySelector('[itemprop="name"]')), getText(question.querySelector(ANSWER_SELECTOR))])).toEqual([
            ['How much is a membership?', 'From 15 € a month.'],
            ['Can I try it?', 'For two weeks, for free.']
        ]);
        expect([...website.querySelectorAll('ui-faq details')].map(details => details.hasAttribute('open'))).toEqual([false, false]);
    });

    test('has an address with its contacts and its microdata', () => {
        const address: Element | null = website.querySelector('ui-address address[itemscope][itemtype="https://schema.org/Dentist"]');
        const postalAddress: Element | null | undefined = address?.querySelector('[itemprop="address"][itemtype="https://schema.org/PostalAddress"]');
        expect(getText(address?.querySelector('[itemprop="name"]'))).toBe('Dental practice Example');
        expect(['streetAddress', 'postalCode', 'addressLocality', 'addressCountry'].map(property => getText(postalAddress?.querySelector(`[itemprop="${property}"]`))))
            .toEqual(['Main Street 1', '50999', 'Cologne', 'Germany']);
        const telephone: Element | null | undefined = address?.querySelector('[itemprop="telephone"]');
        expect(getText(telephone)).toBe('+49 (0) 2234 12 34-5');
        expect(telephone?.closest('a')?.getAttribute('href')).toBe('tel:+49223412345');
        expect(getText(address?.querySelector('[itemprop="email"]'))).toBe('info@example.com');
    });

    test('has periods of dates with the dates machines read', () => {
        const periods: Element[] = [...website.querySelectorAll('ui-date-period')];
        expect(periods.map(period => getText(period))).toEqual(['06/2026', '08/2025 – 06/2026', '02/2022 – today']);
        expect(periods.map(period => [...period.querySelectorAll('time')].map(time => time.getAttribute('datetime')))).toEqual([
            ['2026-06-14'],
            ['2025-08-01', '2026-06-01'],
            ['2022-02-01']
        ]);
    });

    test('has the placeholder of a consent gate, and nothing of its content before the consent', () => {
        const gate: Element | null = website.querySelector('ui-consent-gate');
        expect(findTexts(gate ?? website, 'p')).toEqual([
            'Content from YouTube',
            'To show it, your browser loads it from YouTube, which receives data like your IP address and may set cookies.',
            'Privacy policy of YouTube (opens in a new tab)'
        ]);
        expect(findTexts(gate ?? website, 'button')).toEqual(['Load YouTube']);
        expect(website.querySelector('iframe, ui-iframe')).toBeNull();
        expect(website.body.innerHTML).not.toContain('youtube-nocookie.com');
    });
});