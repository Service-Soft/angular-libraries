import { SeoLocale } from './seo-locale.model';

/**
 * Builds the urls of the pages of a site the same way in the browser and on the server, so the canonical url of a page
 * and the url of the sitemap are always the same one: one url per page, without a slash at its end.
 */
export abstract class SeoUrlUtilities {
    /**
     * Resolves the url of a page in a language, like 'https://example.com/de/imprint'.
     * @param origin - The origin of the site, without a slash at its end.
     * @param path - The path of the page without its language, like '/imprint', or '/' for the start page.
     * @param locale - The language, or undefined for the url without one, which redirects by the language of the visitor.
     * @returns The absolute url.
     */
    static resolveUrl(origin: string, path: string, locale: SeoLocale | undefined): string {
        const prefix: string = locale == undefined || locale.subPath === '' ? '' : `/${locale.subPath}`;
        const pagePath: string = this.normalizePath(path);
        // the start page of a language is /en, without a slash, like every other page; the start page of the site is /
        if (pagePath === '/') {
            return prefix === '' ? `${origin}/` : `${origin}${prefix}`;
        }
        return `${origin}${prefix}${pagePath}`;
    }

    /**
     * Gets the path of a page without its query, its hash and a slash at its end, like '/imprint' of '/imprint/?a=1'.
     * @param url - The path of the page as the router or a request has it.
     * @returns The path, '/' for the start page.
     */
    static normalizePath(url: string): string {
        const path: string = url.split(/[?#]/)[0] ?? '';
        const trimmed: string = path.replace(/\/+$/, '');
        return trimmed === '' ? '/' : trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
}