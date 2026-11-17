import { OpeningHoursRange } from './opening-hours-range.model';

/**
 * A time a business is open, with its times written in the language of the app.
 */
export type OpeningHoursShownRange = OpeningHoursRange & {
    /**
     * When it opens, like '8:00 AM' in English or '8:00' in German.
     */
    opensText: string,
    /**
     * When it closes, written like opensText.
     */
    closesText: string
};