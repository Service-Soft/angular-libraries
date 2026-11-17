/**
 * The start or the end of a period as it shows.
 */
export type DatePeriodPart = {
    /**
     * The date as text, like '02/2022', or the openEndLabel of a period that is still going on.
     */
    text: string,
    /**
     * The date in the machine readable form of the datetime attribute of a time element, like '2022-02-01', undefined
     * for the open end.
     */
    dateTime: string | undefined
};