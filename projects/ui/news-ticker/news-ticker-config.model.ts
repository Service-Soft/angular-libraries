import { IconDefinition } from '@service-soft/ui/icon';

import { NewsTickerColor } from './news-ticker-color.type';

/**
 * The values a news ticker uses when its inputs are not set, and its texts.
 */
export type NewsTickerConfig = {
    /**
     * The background.
     */
    color: NewsTickerColor,
    /**
     * The icon at the start, or undefined for none.
     */
    icon: IconDefinition | undefined,
    /**
     * How fast the headlines move, in pixels per second.
     */
    speed: number,
    /**
     * What screen readers call the ticker.
     */
    label: string,
    /**
     * The button that stops the headlines.
     */
    pauseLabel: string,
    /**
     * The button that moves them again.
     */
    playLabel: string
};