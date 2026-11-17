import { APP_BASE_HREF } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideTableOfContentsConfig } from './table-of-contents-config.provider';
import { TableOfContentsItem } from './table-of-contents-item.model';
import { TableOfContentsComponent } from './table-of-contents.component';
import { TableOfContentsUtilities } from './table-of-contents.utilities';

@Component({
    selector: 'ui-table-of-contents-items-host',
    template: `
        <ui-table-of-contents [items]="items" />
        <h2 id="cookies">Cookies</h2><h3 id="analytics">Analytics</h3><h2 id="rights">Your rights</h2>
    `,
    imports: [TableOfContentsComponent]
})
class ItemsHostComponent {
    readonly items: TableOfContentsItem[] = [
        { name: 'Cookies', fragment: 'cookies', children: [{ name: 'Analytics', fragment: 'analytics' }] },
        { name: 'Your rights', fragment: 'rights' }
    ];
}

@Component({
    selector: 'ui-table-of-contents-container-host',
    template: `
        <ui-table-of-contents [container]="text" />
        <article #text><h1>Privacy</h1><h2>Cookies &amp; tracking</h2><h3>Analytics</h3><h4>Not a link</h4><h3 id="ads">Ads</h3>
        <h2>Contact</h2><h3>Analytics</h3></article>
    `,
    imports: [TableOfContentsComponent]
})
class ContainerHostComponent {}

/**
 * A link of the table of contents: its text, its href, whether it is current, and the links below it.
 */
type Link = [string, string, boolean, Link[]];

function findLinks(list: Element | null | undefined): Link[] {
    return [...list?.querySelectorAll(':scope > li') ?? []].map(item => {
        const link: HTMLAnchorElement | null = item.querySelector(':scope > a');
        return [
            link?.textContent ?? '',
            link?.getAttribute('href') ?? '',
            link?.getAttribute('aria-current') === 'true',
            findLinks(item.querySelector(':scope > ui-table-of-contents-list > ol'))
        ];
    });
}

async function render<T>(component: new () => T): Promise<HTMLElement> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

/**
 * The stand-in for the IntersectionObserver of the browser, which jsdom doesn't have, whose callback the test calls.
 */
class FakeIntersectionObserver implements IntersectionObserver {
    static last: FakeIntersectionObserver | undefined;

    readonly root: Document = document;

    readonly rootMargin: string;

    readonly scrollMargin: string = '0px';

    readonly thresholds: readonly number[] = [0];

    readonly observed: Element[] = [];

    constructor(private readonly callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        this.rootMargin = options.rootMargin ?? '';
        FakeIntersectionObserver.last = this;
    }

    observe(element: Element): void {
        this.observed.push(element);
    }

    unobserve(element: Element): void {
        this.observed.splice(this.observed.indexOf(element), 1);
    }

    disconnect(): void {
        this.observed.length = 0;
    }

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }

    // a heading in the band of the top third of a screen 300px high, above it or below it.
    report(id: string, position: 'above' | 'inside' | 'below'): void {
        const top: number = { above: -50, inside: 50, below: 200 }[position];
        const rect: DOMRectReadOnly = DOMRectReadOnly.fromRect({ y: top, height: 20 });
        this.callback([
            {
                target: this.observed.find(element => element.id === id) ?? document.body,
                isIntersecting: position === 'inside',
                intersectionRatio: position === 'inside' ? 1 : 0,
                boundingClientRect: rect,
                intersectionRect: rect,
                rootBounds: DOMRectReadOnly.fromRect({ y: 0, height: 100 }),
                time: 0
            }
        ], this);
    }
}

describe('TableOfContentsComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [{ provide: APP_BASE_HREF, useValue: '/' }] });
        vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('is a navigation of nested lists of links to the sections given, on the path of the page', async () => {
        const root: HTMLElement = await render(ItemsHostComponent);
        const nav: HTMLElement | null = root.querySelector('nav');
        const path: string = location.pathname;

        expect(root.querySelector(`#${nav?.getAttribute('aria-labelledby')}`)?.textContent).toBe('On this page');
        expect(findLinks(nav?.querySelector(':scope > ui-table-of-contents-list > ol'))).toEqual([
            ['Cookies', `${path}#cookies`, false, [['Analytics', `${path}#analytics`, false, []]]],
            ['Your rights', `${path}#rights`, false, []]
        ]);
    });

    test('links to the headings of a container by their levels, and gives the ones without an id one from their text', async () => {
        const root: HTMLElement = await render(ContainerHostComponent);
        const path: string = location.pathname;

        expect(findLinks(root.querySelector('nav ol'))).toEqual([
            [
                'Cookies & tracking', `${path}#cookies-tracking`, false, [
                    ['Analytics', `${path}#analytics`, false, []],
                    ['Ads', `${path}#ads`, false, []]
                ]
            ],
            ['Contact', `${path}#contact`, false, [['Analytics', `${path}#analytics-2`, false, []]]]
        ]);
        expect([...root.querySelectorAll('article [id]')].map(heading => heading.id))
            .toEqual(['cookies-tracking', 'analytics', 'ads', 'contact', 'analytics-2']);
        expect(root.querySelector('h1')?.id).toBe('');
    });

    test('marks the section whose heading is in the top third of the screen as current, and the one before when it scrolls back', async () => {
        const fixture: ComponentFixture<ItemsHostComponent> = TestBed.createComponent(ItemsHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const findCurrent: () => string[] = () => [...root.querySelectorAll('a[aria-current="true"]')].map(link => link.textContent);

        FakeIntersectionObserver.last?.report('analytics', 'inside');
        await fixture.whenStable();
        expect(findCurrent()).toEqual(['Analytics']);

        // further down in the section, its heading has left at the top, and it stays current
        FakeIntersectionObserver.last?.report('analytics', 'above');
        await fixture.whenStable();
        expect(findCurrent()).toEqual(['Analytics']);

        FakeIntersectionObserver.last?.report('rights', 'inside');
        await fixture.whenStable();
        expect(findCurrent()).toEqual(['Your rights']);

        FakeIntersectionObserver.last?.report('rights', 'below');
        await fixture.whenStable();
        expect(findCurrent()).toEqual(['Analytics']);
        expect(FakeIntersectionObserver.last?.rootMargin).toBe('0px 0px -66% 0px');
    });

    test('highlights nothing when the app turns it off', async () => {
        FakeIntersectionObserver.last = undefined;
        TestBed.configureTestingModule({ providers: [provideTableOfContentsConfig({ spy: false, label: 'Inhalt' })] });
        const root: HTMLElement = await render(ItemsHostComponent);

        expect(FakeIntersectionObserver.last).toBeUndefined();
        expect(root.querySelector('nav p')?.textContent).toBe('Inhalt');
    });
});

// cspell:ignore DSGVO datenschutzerklarung dsgvo
describe('TableOfContentsUtilities.resolveSlug', () => {
    test('writes a text in small letters without accents, with dashes between its words', () => {
        expect(TableOfContentsUtilities.resolveSlug('Café & Bar')).toBe('cafe-bar');
        expect(TableOfContentsUtilities.resolveSlug('  Datenschutzerklärung (DSGVO) ')).toBe('datenschutzerklarung-dsgvo');
        expect(TableOfContentsUtilities.resolveSlug('§ 5 TMG')).toBe('5-tmg');
        expect(TableOfContentsUtilities.resolveSlug('…')).toBe('section');
    });
});