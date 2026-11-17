import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

import { DatePeriodConfig } from './date-period-config.model';
import { DATE_PERIOD_CONFIG } from './date-period-config.provider';
import { DatePeriodDate } from './date-period-date.type';
import { DatePeriodEnd } from './date-period-end.type';
import { DatePeriodFormat } from './date-period-format.type';
import { DatePeriodPart } from './date-period-part.model';
import { DatePeriodUtilities } from './date-period.utilities';

/**
 * Writes a period of dates in the language of the app (LOCALE_ID): `{{ start | uiDatePeriod: end }}`, like
 * '02/2022 – 03/2024', `{{ start | uiDatePeriod: 'open' }}` for one that is still going on, like '02/2022 – today', and
 * `{{ date | uiDatePeriod }}` for a single date. A third argument changes the format, like
 * `{ month: 'short', year: 'numeric' }` for 'Feb 2022 – Mar 2024'.
 * Unset arguments fall back to the values provided with provideDatePeriodConfig. For the dates as time elements, use
 * `<ui-date-period>`.
 */
@Pipe({ name: 'uiDatePeriod' })
export class DatePeriodPipe implements PipeTransform {
    private readonly config: DatePeriodConfig = inject(DATE_PERIOD_CONFIG);
    private readonly locale: string = inject(LOCALE_ID);

    /**
     * Writes the period.
     * @param start - When it started.
     * @param end - When it ended, 'open' for a period that is still going on, or undefined for a single date.
     * @param format - How the dates are written. The default comes from provideDatePeriodConfig.
     * @returns The period as text.
     */
    transform(start: DatePeriodDate, end?: DatePeriodEnd, format: DatePeriodFormat = this.config.format): string {
        const parts: DatePeriodPart[] = DatePeriodUtilities.resolveParts(start, end, format, this.locale, this.config.openEndLabel);
        return parts.map(part => part.text).join(this.config.separator);
    }
}