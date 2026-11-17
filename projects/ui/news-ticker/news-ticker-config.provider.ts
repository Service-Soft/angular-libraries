import { inject, InjectionToken, Provider } from '@angular/core';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';

import { NewsTickerConfig } from './news-ticker-config.model';

const DEFAULT_NEWS_TICKER_CONFIG: NewsTickerConfig = {
    color: 'neutral',
    icon: faBullhorn,
    speed: 50,
    label: 'News',
    pauseLabel: 'Pause news',
    playLabel: 'Play news'
};

/**
 * The values every news ticker below this injector uses when its inputs are not set, and its texts.
 * Change them with provideNewsTickerConfig.
 */
export const NEWS_TICKER_CONFIG: InjectionToken<NewsTickerConfig> = new InjectionToken<NewsTickerConfig>('NEWS_TICKER_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_NEWS_TICKER_CONFIG
});

/**
 * Changes the values news tickers use when their inputs are not set, and their texts, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for NEWS_TICKER_CONFIG.
 */
export function provideNewsTickerConfig(config: Partial<NewsTickerConfig>): Provider {
    return {
        provide: NEWS_TICKER_CONFIG,
        useFactory: (): NewsTickerConfig => ({
            ...inject(NEWS_TICKER_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_NEWS_TICKER_CONFIG,
            ...config
        })
    };
}