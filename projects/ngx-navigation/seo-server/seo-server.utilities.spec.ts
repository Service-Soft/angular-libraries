import { ApplicationInitStatus, Component, inject, InjectionToken, REQUEST_CONTEXT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { NavSitemapEntry } from '@service-soft/ngx-navigation/navigation';
import { provideSeoConfig, SeoLocale, SeoUrlUtilities } from '@service-soft/ngx-navigation/seo';
import { describe, expect, test } from 'vitest';

import { SeoAppEngine } from './seo-app-engine.model';
import { SeoPage } from './seo-page.model';
import { SeoServerUtilities } from './seo-server.utilities';
import { SeoSite } from './seo-site.model';

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

const ORIGIN: string = 'https://club.example';

const EN: SeoLocale = { code: 'en', subPath: 'en' };
const DE: SeoLocale = { code: 'de', subPath: 'de' };
const LOCALES: SeoLocale[] = [EN, DE];

// what the app reads its articles with, like a service of the api
const ARTICLES: InjectionToken<NavSitemapEntry[]> = new InjectionToken<NavSitemapEntry[]>('ARTICLES');

const ARTICLE_ENTRIES: NavSitemapEntry[] = [{ path: '/news/opening/', lastModified: new Date('2026-10-01') }, { path: '/news/season' }];

// loaded lazily, as the module of a feature exports them
const TEAM_ROUTES: Routes = [
    { path: '', component: PageComponent },
    { path: ':team', component: PageComponent }
];

const ROUTES: Routes = [
    { path: '', component: PageComponent, data: { lastModified: new Date('2026-11-01') } },
    { path: 'home', redirectTo: '' },
    { path: 'imprint', component: PageComponent, data: { robots: 'NOINDEX, follow' } },
    { path: 'news', component: PageComponent },
    { path: 'shop', component: PageComponent },
    { path: 'teams', loadChildren: () => Promise.resolve({ default: TEAM_ROUTES }) },
    {
        path: 'news/:article',
        loadComponent: () => Promise.resolve(PageComponent),
        // listed by the route in the app, as the articles are in a database; its prerendered page too, once
        data: { sitemap: () => Promise.resolve(inject(ARTICLES)) }
    },
    // neither prerendered nor listed
    { path: 'members/:member', component: PageComponent },
    { path: '**', component: PageComponent }
];

// the first that matches decides, as with @angular/ssr
const SERVER_ROUTES: ServerRoute[] = [
    { path: 'shop', renderMode: RenderMode.Client },
    { path: 'news', renderMode: RenderMode.Server },
    { path: 'news/:article', renderMode: RenderMode.Server },
    { path: '**', renderMode: RenderMode.Prerender }
];

// the keys of the routes of the prerendered-routes.json of a build of both languages
const PRERENDERED_ROUTES: string[] = ['/en', '/de', '/en/teams', '/de/teams', '/en/teams/juniors', '/de/teams/juniors', '/de/news/season'];

// the html of each page as the app engine answers it, by its url
const PAGES: Record<string, string> = {
    'https://club.example/en': page('Sports club', 'The sports club of the town.'),
    'https://club.example/de': page('Sportverein', 'Der Sportverein der Stadt.'),
    'https://club.example/en/news': page('News &amp; dates', 'What&#39;s new: &quot;everything&quot; &lt;here&gt;'),
    'https://club.example/de/news': page('Neuigkeiten', undefined),
    'https://club.example/en/teams': page('Teams', 'Every team.'),
    'https://club.example/de/teams': page('Mannschaften', 'Jede Mannschaft.'),
    'https://club.example/en/teams/juniors': page('Juniors', undefined),
    'https://club.example/de/teams/juniors': page('Junioren', undefined),
    'https://club.example/en/news/opening': page('Opening', undefined),
    'https://club.example/de/news/opening': page('Eröffnung', undefined),
    'https://club.example/en/news/season': page('Season', undefined)
};

function page(title: string, description: string | undefined): string {
    const meta: string = description == undefined ? '' : `<meta name="description" content="${description}">`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${meta}</head><body></body></html>`;
}

// answers the html of PAGES and, like the AngularNodeAppEngine for a page it renders on the server, starts the app
// with the context of a request as its REQUEST_CONTEXT
function createAppEngine(requests: string[], routes: Routes = ROUTES): SeoAppEngine {
    return {
        handle: async (request, requestContext) => {
            requests.push(request.url);
            if (requestContext != undefined) {
                TestBed.configureTestingModule({
                    providers: [
                        provideRouter(routes),
                        provideSeoConfig({ origin: ORIGIN, locales: LOCALES }),
                        { provide: REQUEST_CONTEXT, useValue: requestContext },
                        { provide: ARTICLES, useValue: ARTICLE_ENTRIES }
                    ]
                });
                // the page renders once the app is initialized
                await TestBed.inject(ApplicationInitStatus).donePromise;
            }
            const html: string | undefined = PAGES[request.url];
            return html == undefined ? new Response('Not found', { status: 404 }) : new Response(html);
        }
    };
}

function createPage(path: string, locales: SeoLocale[], lastModified?: Date): SeoPage {
    return {
        path,
        renderMode: RenderMode.Prerender,
        lastModified,
        localized: locales.map(locale => ({
            locale,
            url: SeoUrlUtilities.resolveUrl(ORIGIN, path, locale),
            title: `${path} in ${locale.code}`,
            description: undefined
        }))
    };
}

describe('SeoServerUtilities', () => {
    test('finds every page of the routes however it renders, in every language, without the ones not to index', async () => {
        const requests: string[] = [];
        const site: SeoSite = await SeoServerUtilities.resolvePages({
            origin: ORIGIN,
            serverRoutes: SERVER_ROUTES,
            prerenderedRoutes: PRERENDERED_ROUTES,
            appEngine: createAppEngine(requests),
            locales: LOCALES
        });

        expect(site.pages.map(p => [p.path, p.renderMode, p.lastModified])).toEqual([
            ['/', RenderMode.Prerender, new Date('2026-11-01')],
            ['/news', RenderMode.Server, undefined],
            ['/shop', RenderMode.Client, undefined],
            ['/teams', RenderMode.Prerender, undefined],
            ['/teams/juniors', RenderMode.Prerender, undefined],
            ['/news/opening', RenderMode.Server, new Date('2026-10-01')],
            ['/news/season', RenderMode.Server, undefined]
        ]);
        expect(site.unlistedRoutes).toEqual(['/members/:member']);
        expect(site.errorRoutes).toEqual([]);
        // the app handed the routes over, rendered for the first server route without parameters that renders on the
        // server, as the route of unknown urls is prerendered here
        expect(requests[0]).toBe('https://club.example/en/news');

        expect(site.pages[0]?.localized).toEqual([
            { locale: EN, url: 'https://club.example/en', title: 'Sports club', description: 'The sports club of the town.' },
            { locale: DE, url: 'https://club.example/de', title: 'Sportverein', description: 'Der Sportverein der Stadt.' }
        ]);
        // the texts as the html holds them, decoded
        expect(site.pages[1]?.localized).toEqual([
            { locale: EN, url: 'https://club.example/en/news', title: 'News & dates', description: 'What\'s new: "everything" <here>' },
            { locale: DE, url: 'https://club.example/de/news', title: 'Neuigkeiten', description: undefined }
        ]);
        // a page only a browser renders has no texts, and is not rendered for them
        expect(site.pages[2]?.localized).toEqual([
            { locale: EN, url: 'https://club.example/en/shop', title: undefined, description: undefined },
            { locale: DE, url: 'https://club.example/de/shop', title: undefined, description: undefined }
        ]);
        expect(requests.filter(url => url.includes('/shop'))).toEqual([]);
        // a page the app engine doesn't answer has no texts either
        expect(site.pages[6]?.localized[1]).toEqual({ locale: DE, url: 'https://club.example/de/news/season', title: undefined, description: undefined });
    });

    test('finds the pages of a site of one language at the urls without a prefix', async () => {
        const routes: Routes = [{ path: '', component: PageComponent }, { path: 'teams/:team', component: PageComponent }];
        const site: SeoSite = await SeoServerUtilities.resolvePages({
            origin: ORIGIN,
            serverRoutes: [
                { path: '', renderMode: RenderMode.Prerender },
                { path: 'teams/:team', renderMode: RenderMode.Prerender },
                { path: '**', renderMode: RenderMode.Server, status: 404 }
            ],
            prerenderedRoutes: ['/', '/teams/juniors'],
            appEngine: createAppEngine([], routes),
            locales: [{ code: 'en-US', subPath: '' }]
        });

        expect(site.pages.map(p => p.localized.map(l => l.url))).toEqual([['https://club.example/'], ['https://club.example/teams/juniors']]);
        expect(site.unlistedRoutes).toEqual([]);
    });

    test('runs data.sitemap in the app as the route of unknown urls renders on the server', async () => {
        const requests: string[] = [];
        const routes: Routes = [
            { path: 'news/:article', component: PageComponent, data: { sitemap: () => Promise.resolve(inject(ARTICLES)) } },
            { path: '**', component: PageComponent }
        ];
        const site: SeoSite = await SeoServerUtilities.resolvePages({
            origin: ORIGIN,
            serverRoutes: [{ path: 'news/:article', renderMode: RenderMode.Server }, { path: '**', renderMode: RenderMode.Server, status: 404 }],
            prerenderedRoutes: [],
            appEngine: createAppEngine(requests, routes),
            locales: LOCALES
        });

        expect(requests[0]).toBe('https://club.example/en/__ngx-seo-sitemap');
        expect(site.pages.map(p => [p.path, p.lastModified])).toEqual([['/news/opening', new Date('2026-10-01')], ['/news/season', undefined]]);
    });

    test('leaves out a page that answers with an error, like one that falls under the 404 of the route of unknown urls', async () => {
        const routes: Routes = [
            { path: '', component: PageComponent },
            // added to the routes, but not to the server routes
            { path: 'contact', component: PageComponent },
            { path: '**', component: PageComponent }
        ];
        const site: SeoSite = await SeoServerUtilities.resolvePages({
            origin: ORIGIN,
            serverRoutes: [{ path: '', renderMode: RenderMode.Prerender }, { path: '**', renderMode: RenderMode.Server, status: 404 }],
            prerenderedRoutes: ['/en', '/de'],
            appEngine: createAppEngine([], routes),
            locales: LOCALES
        });

        expect(site.pages.map(p => p.path)).toEqual(['/']);
        expect(site.errorRoutes).toEqual(['/contact']);
    });

    test('tells why the pages cannot be read when no page renders on the server', async () => {
        const routes: Routes = [{ path: '', component: PageComponent }];
        const pages: Promise<SeoSite> = SeoServerUtilities.resolvePages({
            origin: ORIGIN,
            serverRoutes: [{ path: '**', renderMode: RenderMode.Prerender }],
            prerenderedRoutes: [],
            appEngine: createAppEngine([], routes),
            locales: LOCALES
        });

        await expect(pages).rejects.toThrow('which needs one with RenderMode.Server');
    });

    test('resolves a sitemap with each page in every language, linked to the others and to its url without a language', () => {
        const files: Record<string, string> = SeoServerUtilities.resolveSitemapFiles(
            [createPage('/', LOCALES, new Date('2026-11-01')), createPage('/q&a', LOCALES)],
            ORIGIN
        );

        expect(Object.keys(files)).toEqual(['/sitemap.xml']);
        expect(files['/sitemap.xml']).toBe([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
            '    <url>',
            '        <loc>https://club.example/en</loc>',
            '        <xhtml:link rel="alternate" hreflang="en" href="https://club.example/en"/>',
            '        <xhtml:link rel="alternate" hreflang="de" href="https://club.example/de"/>',
            '        <xhtml:link rel="alternate" hreflang="x-default" href="https://club.example/"/>',
            '        <lastmod>2026-11-01T00:00:00.000Z</lastmod>',
            '    </url>',
            '    <url>',
            '        <loc>https://club.example/de</loc>',
            '        <xhtml:link rel="alternate" hreflang="en" href="https://club.example/en"/>',
            '        <xhtml:link rel="alternate" hreflang="de" href="https://club.example/de"/>',
            '        <xhtml:link rel="alternate" hreflang="x-default" href="https://club.example/"/>',
            '        <lastmod>2026-11-01T00:00:00.000Z</lastmod>',
            '    </url>',
            '    <url>',
            '        <loc>https://club.example/en/q&amp;a</loc>',
            '        <xhtml:link rel="alternate" hreflang="en" href="https://club.example/en/q&amp;a"/>',
            '        <xhtml:link rel="alternate" hreflang="de" href="https://club.example/de/q&amp;a"/>',
            '        <xhtml:link rel="alternate" hreflang="x-default" href="https://club.example/q&amp;a"/>',
            '    </url>',
            '    <url>',
            '        <loc>https://club.example/de/q&amp;a</loc>',
            '        <xhtml:link rel="alternate" hreflang="en" href="https://club.example/en/q&amp;a"/>',
            '        <xhtml:link rel="alternate" hreflang="de" href="https://club.example/de/q&amp;a"/>',
            '        <xhtml:link rel="alternate" hreflang="x-default" href="https://club.example/q&amp;a"/>',
            '    </url>',
            '</urlset>'
        ].join('\n'));
    });

    test('resolves a sitemap without alternates for a site of one language', () => {
        const files: Record<string, string> = SeoServerUtilities.resolveSitemapFiles([createPage('/', [{ code: 'en', subPath: '' }])], ORIGIN);

        expect(files['/sitemap.xml']).toContain('<loc>https://club.example/</loc>');
        expect(files['/sitemap.xml']).not.toContain('xhtml:link');
        expect(files['/sitemap.xml']).not.toContain('lastmod');
    });

    test('tells which page has a lastModified that is no valid date', () => {
        // like the date of an api that new Date could not read
        const pages: SeoPage[] = [createPage('/news', LOCALES, new Date('yesterday'))];

        expect(() => SeoServerUtilities.resolveSitemapFiles(pages, ORIGIN)).toThrow('The lastModified of /news is no valid date.');
    });

    test('splits a sitemap of more than 50,000 urls into parts below an index', () => {
        const pages: SeoPage[] = Array.from({ length: 50_001 }, (_, index) => createPage(`/page-${index}`, [{ code: 'en', subPath: '' }]));
        const files: Record<string, string> = SeoServerUtilities.resolveSitemapFiles(pages, ORIGIN);

        expect(Object.keys(files).sort()).toEqual(['/sitemap-1.xml', '/sitemap-2.xml', '/sitemap.xml']);
        expect(files['/sitemap.xml']).toBe([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            '    <sitemap><loc>https://club.example/sitemap-1.xml</loc></sitemap>',
            '    <sitemap><loc>https://club.example/sitemap-2.xml</loc></sitemap>',
            '</sitemapindex>'
        ].join('\n'));
        expect(files['/sitemap-1.xml']?.match(/<url>/g)).toHaveLength(50_000);
        expect(files['/sitemap-2.xml']?.match(/<url>/g)).toHaveLength(1);
        expect(files['/sitemap-2.xml']).toContain('<loc>https://club.example/page-50000</loc>');
    });

    test('resolves a robots.txt that allows or disallows everything, blocks the crawlers given and links the sitemap', () => {
        expect(SeoServerUtilities.resolveRobotsTxt({
            allowed: true,
            disallowedCrawlers: ['GPTBot', 'CCBot'],
            sitemapUrl: 'https://club.example/sitemap.xml'
        })).toBe([
            'User-agent: *',
            'Allow: /',
            '',
            'User-agent: GPTBot',
            'Disallow: /',
            '',
            'User-agent: CCBot',
            'Disallow: /',
            '',
            'Sitemap: https://club.example/sitemap.xml'
        ].join('\n'));
        expect(SeoServerUtilities.resolveRobotsTxt({ allowed: false, disallowedCrawlers: [], sitemapUrl: 'https://stage.club.example/sitemap.xml' }))
            .toBe('User-agent: *\nDisallow: /\n\nSitemap: https://stage.club.example/sitemap.xml');
    });

    test('resolves an llms.txt per language of the pages that render on the server, linking the other languages', () => {
        const home: SeoPage = createPage('/', LOCALES);
        home.localized = home.localized.map(l => ({ ...l, description: `About the club in ${l.locale.code}` }));
        const shop: SeoPage = { ...createPage('/shop', LOCALES), renderMode: RenderMode.Client };
        shop.localized = shop.localized.map(l => ({ ...l, title: undefined }));
        const pages: SeoPage[] = [home, createPage('/teams', LOCALES), shop];

        expect(SeoServerUtilities.resolveLlmsTxt(pages, DE, LOCALES, ORIGIN)).toBe([
            '# / in de',
            '',
            '> About the club in de',
            '',
            '## Pages',
            '',
            '- [/ in de](https://club.example/de): About the club in de',
            '- [/teams in de](https://club.example/de/teams)',
            '',
            '## Languages',
            '',
            '- [en](https://club.example/llms.txt)'
        ].join('\n'));
        expect(SeoServerUtilities.resolveLlmsTxt(pages, EN, LOCALES, ORIGIN)).toContain('- [de](https://club.example/de/llms.txt)');
        // a site of one language, without a start page, names itself by its origin
        expect(SeoServerUtilities.resolveLlmsTxt([createPage('/teams', [EN])], EN, [EN], ORIGIN))
            .toBe('# https://club.example\n\n## Pages\n\n- [/teams in en](https://club.example/en/teams)');
    });

    test('resolves the language a visitor prefers by the Accept-Language of their browser', () => {
        const locales: SeoLocale[] = [{ code: 'en-US', subPath: 'en' }, { code: 'de', subPath: 'de' }, { code: 'fr-CH', subPath: 'fr' }];

        expect(SeoServerUtilities.resolvePreferredLocale('de-AT,de;q=0.9,en;q=0.8', locales).code).toBe('de');
        // by its quality rather than its place
        expect(SeoServerUtilities.resolvePreferredLocale('en;q=0.5, fr-ch;q=0.9', locales).code).toBe('fr-CH');
        // the language of a code the site has another region of
        expect(SeoServerUtilities.resolvePreferredLocale('fr-FR', locales).code).toBe('fr-CH');
        // one the visitor refuses, and none at all, are the source language
        expect(SeoServerUtilities.resolvePreferredLocale('de;q=0, it', locales).code).toBe('en-US');
        expect(SeoServerUtilities.resolvePreferredLocale('*', locales).code).toBe('en-US');
        expect(SeoServerUtilities.resolvePreferredLocale(undefined, locales).code).toBe('en-US');
        expect(() => SeoServerUtilities.resolvePreferredLocale('de', [])).toThrow('The site needs at least one language.');
    });

    test('redirects an url without a language to the one the visitor prefers', () => {
        expect(SeoServerUtilities.findLocaleRedirect('/', 'de-DE', LOCALES)).toBe('/de');
        expect(SeoServerUtilities.findLocaleRedirect('/teams/juniors?season=2026', 'fr, en', LOCALES)).toBe('/en/teams/juniors?season=2026');
        expect(SeoServerUtilities.findLocaleRedirect('/teams', undefined, LOCALES)).toBe('/en/teams');
        // an url with its language, and the files of the whole site
        expect(SeoServerUtilities.findLocaleRedirect('/de/teams', 'en', LOCALES)).toBeUndefined();
        expect(SeoServerUtilities.findLocaleRedirect('/en', 'de', LOCALES)).toBeUndefined();
        expect(SeoServerUtilities.findLocaleRedirect('/robots.txt', 'de', LOCALES)).toBeUndefined();
        expect(SeoServerUtilities.findLocaleRedirect('/llms.txt', 'de', LOCALES)).toBeUndefined();
        expect(SeoServerUtilities.findLocaleRedirect('/sitemap.xml', 'de', LOCALES)).toBeUndefined();
        expect(SeoServerUtilities.findLocaleRedirect('/sitemap-2.xml', 'de', LOCALES)).toBeUndefined();
        // a segment that only starts like a language
        expect(SeoServerUtilities.findLocaleRedirect('/english', 'de', LOCALES)).toBe('/de/english');
        // a site of one language
        expect(SeoServerUtilities.findLocaleRedirect('/teams', 'de', [EN])).toBeUndefined();
    });

    test('redirects an url with a slash at the end of its path to the one without it', () => {
        expect(SeoServerUtilities.findTrailingSlashRedirect('/teams/')).toBe('/teams');
        expect(SeoServerUtilities.findTrailingSlashRedirect('/de/teams//?season=2026')).toBe('/de/teams?season=2026');
        expect(SeoServerUtilities.findTrailingSlashRedirect('/de/')).toBe('/de');
        expect(SeoServerUtilities.findTrailingSlashRedirect('/')).toBeUndefined();
        expect(SeoServerUtilities.findTrailingSlashRedirect('/?season=2026')).toBeUndefined();
        expect(SeoServerUtilities.findTrailingSlashRedirect('/teams?next=/')).toBeUndefined();
    });
});