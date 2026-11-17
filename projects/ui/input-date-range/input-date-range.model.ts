/**
 * A period from a start to an end, like a booking from its pick-up to its return, in the time zone of the browser.
 * Without times both are midnight of their day. A side is undefined while the input holds no complete date for it.
 */
export type InputDateRange = {
    /**
     * The first day, or moment, of the period.
     */
    start: Date | undefined,
    /**
     * The last day, or moment, of the period.
     */
    end: Date | undefined
};