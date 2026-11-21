import { DOCUMENT } from '@angular/common';
import { EnvironmentInjector, inject, LOCALE_ID, runInInjectionContext, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { NavRouteData } from '@service-soft/ngx-navigation/navigation';
import { filter } from 'rxjs';

import { SeoConfig } from './seo-config.model';
import { SEO_CONFIG } from './seo-config.provider';
import { SeoLocale } from './seo-locale.model';
import { SeoUrlUtilities } from './seo-url.utilities';

// marks the JSON-LD of the page, so a navigation replaces it, and leaves alone the one of the site in its index.html.
const STRUCTURED_DATA_ATTRIBUTE: string = 'data-ngx-seo';

const HREFLANG_ATTRIBUTE: string = 'hreflang';

// '<' as a json escape: a backslash (92) and u003c, which every json parser reads as '<' again.
const ESCAPED_LESS_THAN: string = `${String.fromCodePoint(92)}u003c`;

/**
 * Writes the tags of each page into the head of the document, on every navigation, from the NavRouteData of its
 * routes. Started by provideSeoConfig.
 */
@Service()
export class SeoService {
    private readonly router: Router = inject(Router);

    private readonly meta: Meta = inject(Meta);

    private readonly titleStrategy: TitleStrategy = inject(TitleStrategy);

    private readonly document: Document = inject(DOCUMENT);

    private readonly injector: EnvironmentInjector = inject(EnvironmentInjector);

    private readonly config: SeoConfig = inject(SEO_CONFIG);

    // the language this build of the site is in, which Angular i18n gives every build its own LOCALE_ID for
    private readonly locale: SeoLocale | undefined = this.findLocale(inject(LOCALE_ID));

    constructor() {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
            .subscribe(event => this.writeTags(this.router.routerState.snapshot, event.urlAfterRedirects));
    }

    // every tag is written or removed on every navigation, so none of the page before survives it.
    private writeTags(snapshot: RouterStateSnapshot, url: string): void {
        const [route, data] = this.findPage(snapshot.root);
        // the router of a build of one language knows the path without it, below the base href of its language
        const path: string = SeoUrlUtilities.normalizePath(url);
        const canonicalUrl: string = SeoUrlUtilities.resolveUrl(this.config.origin, path, this.locale);
        const image: string | undefined = data.image ?? this.config.defaultImage;
        // the title of the route rather than of the document, which the router only sets after this navigation ended
        this.writeMeta('property', 'og:title', this.titleStrategy.buildTitle(snapshot));
        this.writeMeta('name', 'description', data.description);
        this.writeMeta('property', 'og:description', data.description);
        this.writeMeta('name', 'robots', data.robots);
        this.writeMeta('property', 'og:url', canonicalUrl);
        this.writeMeta('property', 'og:image', image == undefined ? undefined : new URL(image, `${this.config.origin}/`).href);
        this.writeCanonicalUrl(canonicalUrl);
        this.writeAlternates(path);
        this.writeLocale();
        const structuredData: NavRouteData['structuredData'] = data.structuredData;
        this.writeStructuredData(typeof structuredData === 'function'
            ? runInInjectionContext(this.injector, () => structuredData(route))
            : structuredData);
    }

    // the page is the deepest route, and each value is the one of the deepest route that has it.
    private findPage(root: ActivatedRouteSnapshot): [ActivatedRouteSnapshot, NavRouteData] {
        let route: ActivatedRouteSnapshot = root;
        let data: NavRouteData = root.data;
        while (route.firstChild != undefined) {
            route = route.firstChild;
            data = { ...data, ...route.data };
        }
        return [route, data];
    }

    private writeMeta(attribute: 'name' | 'property', key: string, content: string | undefined): void {
        if (content == undefined) {
            this.meta.removeTag(`${attribute}="${key}"`);
            return;
        }
        this.meta.updateTag({ [attribute]: key, content });
    }

    private writeCanonicalUrl(url: string): void {
        let link: HTMLLinkElement | null = this.document.head.querySelector('link[rel="canonical"]');
        if (link == undefined) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            // appendChild rather than append, which the document of the server doesn't have
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    // the page in every language and, as x-default, its url without one, which redirects by the language of the visitor.
    // Absolute, as search engines take nothing else, and only with more than one language, where they mean something
    private writeAlternates(path: string): void {
        for (const link of this.document.head.querySelectorAll(`link[rel="alternate"][${HREFLANG_ATTRIBUTE}]`)) {
            this.document.head.removeChild(link);
        }
        if (this.config.locales.length < 2) {
            return;
        }
        // each language by its code, and x-default as the url without one
        const alternates: [string, string][] = [...this.config.locales, undefined]
            .map(locale => [locale?.code ?? 'x-default', SeoUrlUtilities.resolveUrl(this.config.origin, path, locale)]);
        for (const [hreflang, href] of alternates) {
            const link: HTMLLinkElement = this.document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute(HREFLANG_ATTRIBUTE, hreflang);
            link.setAttribute('href', href);
            this.document.head.appendChild(link);
        }
    }

    // og takes the language with an underscore, like en_US, and lists the other languages one tag each
    private writeLocale(): void {
        for (const tag of this.meta.getTags('property="og:locale:alternate"')) {
            this.meta.removeTagElement(tag);
        }
        if (this.locale == undefined) {
            this.meta.removeTag('property="og:locale"');
            return;
        }
        this.meta.updateTag({ property: 'og:locale', content: this.locale.code.replace('-', '_') });
        for (const locale of this.config.locales.filter(l => l !== this.locale)) {
            this.meta.addTag({ property: 'og:locale:alternate', content: locale.code.replace('-', '_') });
        }
    }

    // codes are compared without case, as 'en-gb' and 'en-GB' are the same language
    private findLocale(localeId: string): SeoLocale | undefined {
        return this.config.locales.find(locale => locale.code.toLowerCase() === localeId.toLowerCase());
    }

    private writeStructuredData(structuredData: Record<string, unknown> | undefined): void {
        const previous: HTMLScriptElement | null = this.document.head.querySelector(`script[${STRUCTURED_DATA_ATTRIBUTE}]`);
        if (previous != undefined) {
            // removeChild rather than remove, like appendChild above
            this.document.head.removeChild(previous);
        }
        if (structuredData == undefined) {
            return;
        }
        const script: HTMLScriptElement = this.document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute(STRUCTURED_DATA_ATTRIBUTE, '');
        // the server writes the text as it is: a '</script>' in a value would end the script, and the rest be html
        script.textContent = JSON.stringify(structuredData).replaceAll('<', ESCAPED_LESS_THAN);
        this.document.head.appendChild(script);
    }
}