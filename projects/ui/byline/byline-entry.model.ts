import { DatePeriodDate } from '@service-soft/ui/date-period';
import { IconDefinition } from '@service-soft/ui/icon';

/**
 * An entry of a byline as it shows, between the separators: the date, or a text like the author or the reading time.
 */
export type BylineEntry = {
    /**
     * The date, in a time element.
     */
    kind: 'date',
    /**
     * The date.
     */
    date: DatePeriodDate
} | {
    /**
     * A text, like the author, the reading time or the category.
     */
    kind: 'text',
    /**
     * What it says.
     */
    text: string,
    /**
     * A decorative icon in front of it.
     */
    icon: IconDefinition | undefined,
    /**
     * Whether an avatar of the text, which is the name of the author, shows in front of it.
     */
    avatar: boolean,
    /**
     * The tailwind classes of the entry.
     */
    classes: string
};