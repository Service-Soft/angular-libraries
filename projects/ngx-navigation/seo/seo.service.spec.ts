import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavRoute } from '@service-soft/ngx-navigation/navigation';
import { afterEach, describe, expect, test } from 'vitest';

import { provideSeoConfig } from './seo.provider';

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

const ROUTES: NavRoute[] = [
    {
        path: '',
        title: 'Sports club',
        component: PageComponent,
        data: {
            description: 'The sports club of the town.',
            // a value that would end the script, were it written as it is
            structuredData: { '@context': 'https://schema.org', '@type': 'SportsClub', name: 'Club </script><b>bold</b>' },
            image: '/images/club.png'
        }
    },
    { path: 'imprint', title: 'Imprint', component: PageComponent, data: { robots: 'noindex' } },
    {
        path: 'teams',
        title: 'Teams',
        data: { description: 'Every team of the club.' },
        children: [
            {
                path: ':team',
                title: 'Team',
                component: PageComponent,
                // typed by the NavRoute it is a child of
                data: { structuredData: route => ({ '@type': 'SportsTeam', name: route.paramMap.get('team') }) }
            }
        ]
    }
];

function setup(): Router {
    TestBed.configureTestingModule({
        providers: [provideRouter(ROUTES), provideSeoConfig({ origin: 'https://club.example/', defaultImage: 'https://cdn.example/default.png' })]
    });
    return TestBed.inject(Router);
}

function findContent(selector: string): string | undefined {
    return document.head.querySelector(selector)?.getAttribute('content') ?? undefined;
}

function findAlternates(): [string | null, string | null][] {
    return [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')]
        .map(link => [link.getAttribute('hreflang'), link.getAttribute('href')]);
}

function findStructuredData(): unknown[] {
    return [...document.head.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent) as unknown);
}

describe('provideSeoConfig', () => {
    afterEach(() => {
        for (const element of document.head.querySelectorAll('meta, link, script')) {
            element.remove();
        }
    });

    test('writes the description, the canonical url without query, the structured data and the og tags of a page', async () => {
        const router: Router = setup();
        await router.navigateByUrl('/?utm_source=newsletter#news');

        expect(findContent('meta[name="description"]')).toBe('The sports club of the town.');
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://club.example/');
        expect(findStructuredData()).toEqual([{ '@context': 'https://schema.org', '@type': 'SportsClub', name: 'Club </script><b>bold</b>' }]);
        // read as json, the text has no '<' that would end the script
        expect(document.head.querySelector('script[type="application/ld+json"]')?.textContent).not.toContain('<');
        expect(findContent('meta[property="og:title"]')).toBe('Sports club');
        expect(findContent('meta[property="og:description"]')).toBe('The sports club of the town.');
        expect(findContent('meta[property="og:url"]')).toBe('https://club.example/');
        expect(findContent('meta[property="og:image"]')).toBe('https://club.example/images/club.png');
        expect(findContent('meta[name="robots"]')).toBeUndefined();
    });

    test('leaves no tag of the page before, and the structured data of the site alone', async () => {
        // the JSON-LD of the whole site, in its index.html
        const site: HTMLScriptElement = document.createElement('script');
        site.setAttribute('type', 'application/ld+json');
        site.textContent = JSON.stringify({ '@type': 'Organization', name: 'Club' });
        document.head.append(site);
        const router: Router = setup();
        await router.navigateByUrl('/');

        await router.navigateByUrl('/imprint');
        expect(findStructuredData()).toEqual([{ '@type': 'Organization', name: 'Club' }]);
        expect(findContent('meta[name="description"]')).toBeUndefined();
        expect(findContent('meta[property="og:description"]')).toBeUndefined();
        expect(findContent('meta[name="robots"]')).toBe('noindex');
        expect(findContent('meta[property="og:image"]')).toBe('https://cdn.example/default.png');
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://club.example/imprint');
        expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    });

    test('takes each value from the deepest route that has it, and resolves structured data from the route', async () => {
        const router: Router = setup();
        await router.navigateByUrl('/teams/juniors');

        expect(findContent('meta[name="description"]')).toBe('Every team of the club.');
        expect(findStructuredData()).toEqual([{ '@type': 'SportsTeam', name: 'juniors' }]);
        expect(findContent('meta[property="og:title"]')).toBe('Team');
    });

    test('links a page in a site of several languages to itself in each, and to its url without a language', async () => {
        // the build of the German language, which Angular i18n gives its own LOCALE_ID and serves below /de
        TestBed.configureTestingModule({
            providers: [
                provideRouter(ROUTES),
                provideSeoConfig({ origin: 'https://club.example', locales: [{ code: 'en', subPath: 'en' }, { code: 'de-CH', subPath: 'de' }] }),
                { provide: LOCALE_ID, useValue: 'de-ch' }
            ]
        });
        const router: Router = TestBed.inject(Router);
        await router.navigateByUrl('/teams/juniors?season=2026');

        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://club.example/de/teams/juniors');
        expect(findAlternates()).toEqual([
            ['en', 'https://club.example/en/teams/juniors'],
            ['de-CH', 'https://club.example/de/teams/juniors'],
            ['x-default', 'https://club.example/teams/juniors']
        ]);
        expect(findContent('meta[property="og:url"]')).toBe('https://club.example/de/teams/juniors');
        expect(findContent('meta[property="og:locale"]')).toBe('de_CH');
        expect([...document.head.querySelectorAll('meta[property="og:locale:alternate"]')].map(meta => meta.getAttribute('content')))
            .toEqual(['en']);

        // the start page of a language has no slash at its end, the one of the whole site is /
        await router.navigateByUrl('/');
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://club.example/de');
        expect(findAlternates()).toEqual([
            ['en', 'https://club.example/en'],
            ['de-CH', 'https://club.example/de'],
            ['x-default', 'https://club.example/']
        ]);
        expect(document.head.querySelectorAll('meta[property="og:locale:alternate"]')).toHaveLength(1);
    });

    test('writes no alternates for a site of one language', async () => {
        const router: Router = setup();
        await router.navigateByUrl('/imprint');

        expect(findAlternates()).toEqual([]);
        expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://club.example/imprint');
        expect(findContent('meta[property="og:locale"]')).toBeUndefined();
    });
});