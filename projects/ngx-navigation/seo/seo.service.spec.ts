import { Component } from '@angular/core';
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
});