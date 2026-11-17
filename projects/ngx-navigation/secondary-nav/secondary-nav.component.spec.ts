import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NavLink } from '@service-soft/ngx-navigation/navigation';
import { describe, expect, test } from 'vitest';

import { SecondaryNavComponent } from './secondary-nav.component';

// the condition reads a signal, so the link shows and hides with it.
const SHOWS_NEWS: WritableSignal<boolean> = signal(false);

const LINKS: NavLink[] = [
    { type: 'link', name: 'Start', route: 'football' },
    { type: 'link', name: 'Training', route: 'football/training' },
    { type: 'link', name: 'News', route: 'football/news', condition: () => SHOWS_NEWS() },
    { type: 'link', name: 'Association', url: 'https://example.com/football' }
];

@Component({ selector: 'ngx-page', template: '<ngx-secondary-nav label="Football" [links]="links" />', imports: [SecondaryNavComponent] })
class PageComponent {
    readonly links: NavLink[] = LINKS;
}

async function create(): Promise<RouterTestingHarness> {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', component: PageComponent }])] });
    return RouterTestingHarness.create();
}

function findLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
    return [...harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Football"] a') ?? []];
}

// jsdom has no layout, so the sizes the scrolling reads are set on the elements it reads them from.
function stubLayout(element: Element | undefined | null, sizes: Partial<Record<'offsetLeft' | 'offsetWidth' | 'clientWidth', number>>): void {
    for (const [key, value] of Object.entries(sizes)) {
        Object.defineProperty(element, key, { configurable: true, value });
    }
}

describe('SecondaryNavComponent', () => {
    test('is a navigation of pills, the one of the current page marked, the ones whose condition holds shown', async () => {
        const harness: RouterTestingHarness = await create();
        await harness.navigateByUrl('/football/training');

        const links: HTMLAnchorElement[] = findLinks(harness);
        expect(links.map(link => [link.textContent.trim(), link.getAttribute('href')])).toEqual([
            ['Start', '/football'],
            ['Training', '/football/training'],
            ['Association', 'https://example.com/football']
        ]);
        expect(links.map(link => link.getAttribute('aria-current') ?? undefined)).toEqual([undefined, 'page', undefined]);
        expect(links[0]?.classList).toContain('rounded-link-pill');

        SHOWS_NEWS.set(true);
        harness.detectChanges();
        await harness.fixture.whenStable();
        expect(findLinks(harness).map(link => link.textContent.trim())).toEqual(['Start', 'Training', 'News', 'Association']);
        SHOWS_NEWS.set(false);
    });

    test('scrolls the link of the current page into the middle of its row', async () => {
        const harness: RouterTestingHarness = await create();
        await harness.navigateByUrl('/football');
        const list: HTMLElement | null | undefined = harness.routeNativeElement?.querySelector('ul');
        stubLayout(list, { clientWidth: 200 });
        stubLayout(findLinks(harness)[1], { offsetLeft: 500, offsetWidth: 100 });

        await harness.navigateByUrl('/football/training');
        await harness.fixture.whenStable();
        expect(list?.scrollLeft).toBe(450);
    });
});