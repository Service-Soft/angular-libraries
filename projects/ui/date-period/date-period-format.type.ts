/**
 * How a date of a period is written: the options of Intl.DateTimeFormat, like { month: 'short', year: 'numeric' } for
 * 'Feb 2022', or a function that writes it itself, which gets the date and the language of the app (LOCALE_ID).
 */
export type DatePeriodFormat = Intl.DateTimeFormatOptions | ((date: Date, locale: string) => string);