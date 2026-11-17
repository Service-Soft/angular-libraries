/**
 * The times of the day a date range can start and end at, as 'HH:mm' like '09:30': the same ones every day, or the
 * ones of a day, like the opening hours of a rental, which are shorter on a Saturday. A day without times can't be
 * the start or the end.
 */
export type InputDateRangeTimes = readonly string[] | ((day: Date) => readonly string[]);