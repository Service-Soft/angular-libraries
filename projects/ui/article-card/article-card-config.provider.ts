import { inject, InjectionToken, Provider } from '@angular/core';

import { ArticleCardConfig } from './article-card-config.model';

// a list of articles is usually a section of a page, below its h1.
const DEFAULT_ARTICLE_CARD_CONFIG: ArticleCardConfig = {
    layout: 'vertical',
    headingLevel: 2
};

/**
 * The values every article card below this injector uses when its inputs are not set.
 * Change them with provideArticleCardConfig.
 */
export const ARTICLE_CARD_CONFIG: InjectionToken<ArticleCardConfig> = new InjectionToken<ArticleCardConfig>('ARTICLE_CARD_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_ARTICLE_CARD_CONFIG
});

/**
 * Changes the values article cards use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ARTICLE_CARD_CONFIG.
 */
export function provideArticleCardConfig(config: Partial<ArticleCardConfig>): Provider {
    return {
        provide: ARTICLE_CARD_CONFIG,
        useFactory: (): ArticleCardConfig => ({
            ...inject(ARTICLE_CARD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ARTICLE_CARD_CONFIG,
            ...config
        })
    };
}