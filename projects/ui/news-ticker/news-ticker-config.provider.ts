import { inject, InjectionToken, Provider } from '@angular/core';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';

import { NewsTickerConfig } from './news-ticker-config.model';

/**
 * The values of a news ticker when nothing changes them. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultNewsTickerConfig(): NewsTickerConfig {
    return {
        color: 'neutral',
        icon: faBullhorn,
        speed: 50,
        label: $localize`:@@ui.news-ticker.label:News`,
        pauseLabel: $localize`:@@ui.news-ticker.pauseLabel:Pause news`,
        playLabel: $localize`:@@ui.news-ticker.playLabel:Play news`
    };
}

/**
 * The values every news ticker below this injector uses when its inputs are not set, and its texts.
 * Change them with provideNewsTickerConfig.
 */
export const NEWS_TICKER_CONFIG: InjectionToken<NewsTickerConfig> = new InjectionToken<NewsTickerConfig>('NEWS_TICKER_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultNewsTickerConfig()
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
            ...inject(NEWS_TICKER_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultNewsTickerConfig(),
            ...config
        })
    };
}