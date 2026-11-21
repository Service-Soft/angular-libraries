import { ServerRoute } from '@angular/ssr';
import { SeoLocale } from '@service-soft/ngx-navigation/seo';

import { SeoAppEngine } from './seo-app-engine.model';

/**
 * Where resolvePages finds the pages of a site: the app, how Angular renders them, and what its build wrote.
 */
export type SeoServerConfig = {
    /**
     * The origin of the site, like 'https://example.com', without a slash at its end.
     */
    origin: string,
    /**
     * The server routes of the app, the same that withRoutes of provideServerRendering gets, which say how each page
     * renders.
     */
    serverRoutes: ServerRoute[],
    /**
     * The urls Angular prerendered, with their language, as the keys of the routes of the prerendered-routes.json its
     * build writes, like '/en/teams/u12'. They list the pages of a route with parameters that prerenders.
     */
    prerenderedRoutes: string[],
    /**
     * What answers each page, prerendered or rendered for the request, to read its title and its description in each
     * language: the AngularNodeAppEngine, which serves the prerendered pages of its build as well.
     */
    appEngine: SeoAppEngine,
    /**
     * The languages of the site, as Angular i18n builds them, the source language first. For a site with one language,
     * one with an empty subPath.
     */
    locales: SeoLocale[]
};