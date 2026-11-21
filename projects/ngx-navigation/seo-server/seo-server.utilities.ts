import { RenderMode, ServerRoute } from '@angular/ssr';
import { NavSitemapEntry } from '@service-soft/ngx-navigation/navigation';
import { SeoLocale, SeoSitemapContext, SeoSitemapRoute, SeoUrlUtilities } from '@service-soft/ngx-navigation/seo';

import { SeoLocalizedPage } from './seo-localized-page.model';
import { SeoPage } from './seo-page.model';
import { SeoRobotsOptions } from './seo-robots-options.model';
import { SeoServerConfig } from './seo-server-config.model';
import { SeoSite } from './seo-site.model';

/**
 * The title and the description of a page as its html holds them.
 */
type PageTexts = Pick<SeoLocalizedPage, 'title' | 'description'>;

// what search engines read of one sitemap at most, see https://www.sitemaps.org/protocol.html
const MAX_SITEMAP_URLS: number = 50_000;
const MAX_SITEMAP_BYTES: number = 50 * 1024 * 1024;

const SITEMAP_PATH: string = '/sitemap.xml';

// the page resolvePages has the app render to get the routes of its pages: an unknown one, which the route of unknown
// urls renders on the server, to answer 404
const SITEMAP_REQUEST_PATH: string = '/__ngx-seo-sitemap';

// the files a server answers itself, which are the same in every language and redirect to none
const SITE_FILES: string[] = ['/robots.txt', '/llms.txt'];

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&apos;' };

const HTML_ENTITIES: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'', '&amp;': '&' };

/**
 * What a website tells search engines and AI assistants about all of its pages, for its server: the sitemap, the
 * robots.txt and the llms.txt, and the redirects that give each page one url. Built from the routes of the app, so a
 * page is found however Angular renders it, and in every language Angular i18n builds.
 */
export abstract class SeoServerUtilities {
    /**
     * Finds every page of a site that search engines may index, in every language: the routes of the router config,
     * children and lazily loaded children included, without redirects, without the route of unknown urls and without
     * routes whose data.robots holds noindex. The app hands them over as the app engine renders a page on the server,
     * as only the app has them with its texts. A route with parameters gets the pages Angular prerendered for it, and
     * the ones its data.sitemap lists, which the app runs then. A route whose server route answers with an error, like
     * the 404 of the route of unknown urls, is left out. The title and description of a page in each language are read
     * from the page as that language renders it, as the app engine answers it: prerendered, or rendered once now. A
     * page only a browser renders has neither.
     * @param config - Where the pages are found.
     * @returns The pages, the routes with parameters whose pages could not be listed, and the routes that answer with
     * an error.
     * @throws {Error} When no page renders on the server for the app to hand the routes over.
     */
    static async resolvePages(config: SeoServerConfig): Promise<SeoSite> {
        const prerenderedPaths: string[] = this.findPrerenderedPaths(config);
        const pages: SeoPage[] = [];
        const unlistedRoutes: string[] = [];
        const errorRoutes: string[] = [];
        for (const route of await this.resolveSitemapRoutes(config)) {
            const serverRoute: ServerRoute | undefined = this.findServerRoute(config.serverRoutes, route.path);
            if (this.hasErrorStatus(serverRoute)) {
                errorRoutes.push(`/${route.path}`);
                continue;
            }
            const renderMode: RenderMode = serverRoute?.renderMode ?? RenderMode.Server;
            const entries: NavSitemapEntry[] = this.resolveEntries(route, prerenderedPaths);
            if (!entries.length) {
                unlistedRoutes.push(`/${route.path}`);
            }
            for (const entry of entries) {
                pages.push({
                    path: entry.path,
                    renderMode,
                    lastModified: entry.lastModified ?? route.data.lastModified,
                    localized: await Promise.all(
                        config.locales.map(locale => this.resolveLocalizedPage(config, entry.path, locale, renderMode))
                    )
                });
            }
        }
        return { pages, unlistedRoutes, errorRoutes };
    }

    /**
     * Resolves the sitemap of a site: one url per page and language, with the url of the page in every other language
     * and its url without a language as x-default, and the date of its content when it is known. Over 50,000 urls or
     * 50 MB, /sitemap.xml is an index of the parts /sitemap-1.xml, /sitemap-2.xml and so on.
     * @param pages - The pages of the site.
     * @param origin - The origin of the site, which the index links its parts with.
     * @returns Each file of the sitemap, by its path.
     */
    static resolveSitemapFiles(pages: SeoPage[], origin: string): Record<string, string> {
        const entries: string[] = pages.flatMap(page => page.localized.map(localized => this.resolveSitemapEntry(page, localized)));
        const parts: string[][] = this.splitSitemap(entries);
        if (parts.length === 1) {
            return { [SITEMAP_PATH]: this.resolveUrlSet(parts[0] ?? []) };
        }
        const files: Record<string, string> = {};
        const sitemaps: string[] = parts.map((part, index) => {
            const partPath: string = `/sitemap-${index + 1}.xml`;
            const partUrl: string = this.escapeXml(origin + partPath);
            files[partPath] = this.resolveUrlSet(part);
            return `    <sitemap><loc>${partUrl}</loc></sitemap>`;
        });
        files[SITEMAP_PATH] = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...sitemaps,
            '</sitemapindex>'
        ].join('\n');
        return files;
    }

    /**
     * Resolves the robots.txt of a site: whether search engines may read it, the crawlers that may not, and where its
     * sitemap is.
     * @param options - What it says.
     * @returns The robots.txt.
     */
    static resolveRobotsTxt(options: SeoRobotsOptions): string {
        return [
            'User-agent: *',
            `${options.allowed ? 'Allow' : 'Disallow'}: /`,
            '',
            ...options.disallowedCrawlers.flatMap(crawler => [`User-agent: ${crawler}`, 'Disallow: /', '']),
            `Sitemap: ${options.sitemapUrl}`
        ].join('\n');
    }

    /**
     * Resolves the llms.txt of a site in one language, see https://llmstxt.org: what the site is, and its pages that
     * render on the server, which assistants read without running a script. Lists where the other languages have
     * theirs: /llms.txt is the one of the source language, /<subPath>/llms.txt the one of another.
     * @param pages - The pages of the site.
     * @param locale - The language.
     * @param locales - Every language of the site, the source language first.
     * @param origin - The origin of the site.
     * @returns The llms.txt, in markdown.
     */
    static resolveLlmsTxt(pages: SeoPage[], locale: SeoLocale, locales: SeoLocale[], origin: string): string {
        const localized: SeoLocalizedPage[] = pages
            .flatMap(page => page.localized.filter(l => l.locale.code === locale.code && l.title != undefined));
        const home: SeoLocalizedPage | undefined = pages
            .find(page => page.path === '/')
            ?.localized.find(l => l.locale.code === locale.code);
        const others: SeoLocale[] = locales.filter(l => l.code !== locale.code);
        return [
            `# ${home?.title ?? origin}`,
            ...home?.description == undefined ? [] : ['', `> ${home.description}`],
            '',
            '## Pages',
            '',
            ...localized.map(page => `- [${page.title}](${page.url})${page.description == undefined ? '' : ': ' + page.description}`),
            ...others.length
                ? ['', '## Languages', '', ...others.map(l => `- [${l.code}](${this.resolveLlmsTxtUrl(l, locales, origin)})`)]
                : []
        ].join('\n');
    }

    /**
     * Resolves the language a visitor prefers, by the Accept-Language header of their browser: the first language of
     * the site they accept, by its code or by the language of it, like 'de' for 'de-AT'.
     * @param acceptLanguage - The Accept-Language header, like 'de-AT,de;q=0.9,en;q=0.8'.
     * @param locales - The languages of the site, the source language first.
     * @returns The language, the source language when the visitor accepts none of them.
     * @throws {Error} When the site has no language.
     */
    static resolvePreferredLocale(acceptLanguage: string | undefined, locales: SeoLocale[]): SeoLocale {
        const source: SeoLocale | undefined = locales[0];
        if (source == undefined) {
            throw new Error('The site needs at least one language.');
        }
        const accepted: string[] = (acceptLanguage ?? '')
            .split(',')
            .map(part => part.trim().split(';q='))
            .map(([tag = '', quality = '1']) => ({ tag: tag.toLowerCase(), quality: Number(quality) }))
            .filter(language => language.tag !== '' && language.tag !== '*' && language.quality > 0)
            .sort((a, b) => b.quality - a.quality)
            .map(language => language.tag);
        for (const tag of accepted) {
            const locale: SeoLocale | undefined = locales.find(l => l.code.toLowerCase() === tag)
                ?? locales.find(l => l.code.toLowerCase().split('-')[0] === tag.split('-')[0]);
            if (locale != undefined) {
                return locale;
            }
        }
        return source;
    }

    /**
     * Finds where an url without a language redirects to, for a site in several languages: the same page in the
     * language the visitor prefers. Answer it with a 302 and Vary: Accept-Language, so search engines index each
     * language at its own url.
     * @param url - The path of the request, with its query.
     * @param acceptLanguage - The Accept-Language header of the request.
     * @param locales - The languages of the site, the source language first.
     * @returns The url to redirect to, or undefined for an url that has its language, a file of the whole site or a site
     * with one language.
     */
    static findLocaleRedirect(url: string, acceptLanguage: string | undefined, locales: SeoLocale[]): string | undefined {
        if (locales.length < 2) {
            return undefined;
        }
        const pagePath: string = SeoUrlUtilities.normalizePath(url);
        const firstSegment: string = pagePath.split('/')[1] ?? '';
        if (locales.some(locale => locale.subPath === firstSegment) || SITE_FILES.includes(pagePath) || this.isSitemapPath(pagePath)) {
            return undefined;
        }
        const query: string = url.includes('?') ? url.slice(url.indexOf('?')) : '';
        const target: SeoLocale = this.resolvePreferredLocale(acceptLanguage, locales);
        return `${new URL(SeoUrlUtilities.resolveUrl('http://localhost', pagePath, target)).pathname}${query}`;
    }

    /**
     * Finds where an url with a slash at the end of its path redirects to: the url without it, the query kept, so each
     * page has one url. Answer it with a 301.
     * @param url - The path of the request, with its query.
     * @returns The url to redirect to, or undefined for one without a slash at its end and the start page.
     */
    static findTrailingSlashRedirect(url: string): string | undefined {
        const queryStart: number = url.indexOf('?');
        const urlPath: string = queryStart === -1 ? url : url.slice(0, queryStart);
        if (urlPath === '/' || !urlPath.endsWith('/')) {
            return undefined;
        }
        return `${SeoUrlUtilities.normalizePath(urlPath)}${queryStart === -1 ? '' : url.slice(queryStart)}`;
    }

    // the routes of the pages, which the app hands over as it renders a page on the server for a request with the
    // context, once it ran their data.sitemap. Only a page rendered for each request gets it: the route of unknown
    // urls, or else a server route without parameters that renders on the server
    private static async resolveSitemapRoutes(config: SeoServerConfig): Promise<SeoSitemapRoute[]> {
        const staticPaths: string[] = config.serverRoutes
            .map(serverRoute => `/${serverRoute.path}`)
            .filter(path => !this.hasParameters(path) && !path.includes('*'));
        const candidates: string[] = [SITEMAP_REQUEST_PATH, ...staticPaths].filter(candidate => {
            return (this.findServerRoute(config.serverRoutes, candidate)?.renderMode ?? RenderMode.Server) === RenderMode.Server;
        });
        for (const candidate of candidates) {
            const context: SeoSitemapContext = { ngxSeoSitemap: undefined };
            const url: string = SeoUrlUtilities.resolveUrl(config.origin, candidate, config.locales[0]);
            const response: Response | null = await config.appEngine.handle(new Request(url), context);
            // the app has handed them over once the page is rendered
            await response?.text();
            if (context.ngxSeoSitemap != undefined) {
                return context.ngxSeoSitemap;
            }
        }
        throw new Error('The app hands the server the routes of its pages as the server renders a page, which needs one with '
            + 'RenderMode.Server, like the route of unknown urls: { path: \'**\', renderMode: RenderMode.Server, status: 404 }. '
            + 'And the app needs provideSeoConfig.');
    }

    // the pages of a route: the one of its path, or the ones of its parameters, listed or prerendered
    private static resolveEntries(route: SeoSitemapRoute, prerenderedPaths: string[]): NavSitemapEntry[] {
        if (!this.hasParameters(route.path)) {
            return [{ path: `/${route.path}` }];
        }
        const listed: NavSitemapEntry[] = route.listed ?? [];
        const prerendered: NavSitemapEntry[] = prerenderedPaths
            .filter(prerenderedPath => this.matchesPattern(route.path, prerenderedPath))
            .filter(prerenderedPath => !listed.some(entry => SeoUrlUtilities.normalizePath(entry.path) === prerenderedPath))
            .map(prerenderedPath => ({ path: prerenderedPath }));
        return [...listed.map(entry => ({ ...entry, path: SeoUrlUtilities.normalizePath(entry.path) })), ...prerendered];
    }

    private static hasParameters(routePath: string): boolean {
        return routePath.split('/').some(segment => segment.startsWith(':'));
    }

    private static async resolveLocalizedPage(
        config: SeoServerConfig,
        pagePath: string,
        locale: SeoLocale,
        renderMode: RenderMode
    ): Promise<SeoLocalizedPage> {
        const url: string = SeoUrlUtilities.resolveUrl(config.origin, pagePath, locale);
        const texts: PageTexts = renderMode === RenderMode.Client
            ? { title: undefined, description: undefined }
            : await this.resolvePageTexts(config, url);
        return { locale, url, ...texts };
    }

    // the page as the app engine answers it: its prerendered html, or the page rendered now
    private static async resolvePageTexts(config: SeoServerConfig, url: string): Promise<PageTexts> {
        const response: Response | null = await config.appEngine.handle(new Request(url));
        return response?.ok === true ? this.findPageTexts(await response.text()) : { title: undefined, description: undefined };
    }

    private static findPageTexts(html: string): PageTexts {
        const title: string | undefined = /<title>([^<]*)<\/title>/.exec(html)?.[1];
        const description: string | undefined = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
        return {
            title: title == undefined ? undefined : this.decodeHtml(title),
            description: description == undefined ? undefined : this.decodeHtml(description)
        };
    }

    // the paths of the prerendered pages without their language, which the routes with parameters are matched against
    private static findPrerenderedPaths(config: SeoServerConfig): string[] {
        const subPaths: string[] = config.locales.map(locale => locale.subPath).filter(subPath => subPath !== '');
        const paths: string[] = config.prerenderedRoutes.map(route => {
            const segments: string[] = route.split('/').filter(segment => segment !== '');
            const withoutLocale: string[] = subPaths.includes(segments[0] ?? '') ? segments.slice(1) : segments;
            return `/${withoutLocale.join('/')}`;
        });
        return [...new Set(paths)];
    }

    // the first server route that matches, like the router of @angular/ssr finds it. A page renders on the server when
    // none does
    private static findServerRoute(serverRoutes: ServerRoute[], routePath: string): ServerRoute | undefined {
        return serverRoutes.find(serverRoute => this.matchesPattern(serverRoute.path, routePath));
    }

    // like a route without a server route of its own, which falls under the 404 of the route of unknown urls
    private static hasErrorStatus(serverRoute: ServerRoute | undefined): boolean {
        return serverRoute != undefined && 'status' in serverRoute && serverRoute.status != undefined && serverRoute.status >= 400;
    }

    // whether a path matches a pattern of routes, like 'teams/:team', '*' or '**'. A parameter of the path matches a
    // parameter or any segment of the pattern
    private static matchesPattern(pattern: string, routePath: string): boolean {
        const patternSegments: string[] = pattern.split('/').filter(segment => segment !== '');
        const pathSegments: string[] = routePath.split('/').filter(segment => segment !== '');
        for (const [index, segment] of patternSegments.entries()) {
            if (segment === '**') {
                return true;
            }
            const pathSegment: string | undefined = pathSegments[index];
            if (pathSegment == undefined) {
                return false;
            }
            if (segment !== '*' && !segment.startsWith(':') && segment !== pathSegment) {
                return false;
            }
        }
        return patternSegments.length === pathSegments.length;
    }

    private static resolveSitemapEntry(page: SeoPage, localized: SeoLocalizedPage): string {
        // alternates only mean something with more than one language
        const alternates: string[] = page.localized.length < 2
            ? []
            : [
                ...page.localized.map(other => this.resolveAlternate(other.locale.code, other.url)),
                this.resolveAlternate('x-default', SeoUrlUtilities.resolveUrl(new URL(localized.url).origin, page.path, undefined))
            ];
        return [
            '    <url>',
            `        <loc>${this.escapeXml(localized.url)}</loc>`,
            ...alternates,
            ...page.lastModified == undefined
                ? []
                : [`        <lastmod>${this.resolveLastModified(page.path, page.lastModified)}</lastmod>`],
            '    </url>'
        ].join('\n');
    }

    // the W3C datetime of the sitemap protocol, like 2026-11-01T00:00:00.000Z
    private static resolveLastModified(path: string, lastModified: Date): string {
        // like a date of an api that new Date could not read
        if (Number.isNaN(lastModified.getTime())) {
            throw new Error(`The lastModified of ${path} is no valid date.`);
        }
        return lastModified.toISOString();
    }

    private static resolveAlternate(hreflang: string, href: string): string {
        return `        <xhtml:link rel="alternate" hreflang="${this.escapeXml(hreflang)}" href="${this.escapeXml(href)}"/>`;
    }

    private static resolveUrlSet(entries: string[]): string {
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
            ...entries,
            '</urlset>'
        ].join('\n');
    }

    // parts of at most 50,000 urls and 50 MB each, measured in bytes as the file is sent
    private static splitSitemap(entries: string[]): string[][] {
        const parts: string[][] = [[]];
        let bytes: number = 0;
        for (const entry of entries) {
            const entryBytes: number = new TextEncoder().encode(entry).length + 1;
            const current: string[] = parts.at(-1) ?? [];
            if (current.length >= MAX_SITEMAP_URLS || bytes + entryBytes > MAX_SITEMAP_BYTES - 1024) {
                parts.push([entry]);
                bytes = entryBytes;
                continue;
            }
            current.push(entry);
            bytes += entryBytes;
        }
        return parts;
    }

    private static resolveLlmsTxtUrl(locale: SeoLocale, locales: SeoLocale[], origin: string): string {
        return locale === locales[0] || locale.subPath === '' ? `${origin}/llms.txt` : `${origin}/${locale.subPath}/llms.txt`;
    }

    private static isSitemapPath(pagePath: string): boolean {
        return /^\/sitemap(-\d+)?\.xml$/.test(pagePath);
    }

    private static escapeXml(value: string): string {
        return value.replaceAll(/[&<>"']/g, character => XML_ESCAPES[character] ?? character);
    }

    private static decodeHtml(value: string): string {
        return value.replaceAll(/&(lt|gt|quot|#39|amp);/g, entity => HTML_ENTITIES[entity] ?? entity);
    }
}