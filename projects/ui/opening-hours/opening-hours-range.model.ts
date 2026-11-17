/**
 * A time a business is open on a day, like from '08:00' to '12:00'.
 */
export type OpeningHoursRange = {
    /**
     * When it opens, as 'HH:mm' in 24 hours, like '08:00'.
     */
    opens: string,
    /**
     * When it closes, as 'HH:mm' in 24 hours, like '18:00'. A time at or before opens is on the next day, like '02:00'
     * for a bar, and '00:00' is midnight.
     */
    closes: string
};