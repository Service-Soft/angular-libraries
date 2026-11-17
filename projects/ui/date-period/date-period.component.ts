import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';

import { DatePeriodConfig } from './date-period-config.model';
import { DATE_PERIOD_CONFIG } from './date-period-config.provider';
import { DatePeriodDate } from './date-period-date.type';
import { DatePeriodEnd } from './date-period-end.type';
import { DatePeriodFormat } from './date-period-format.type';
import { DatePeriodPart } from './date-period-part.model';
import { DatePeriodUtilities } from './date-period.utilities';

/**
 * A period of dates, like '02/2022 – today', with each date in a time element that gives search engines and other
 * machines the date itself: `<ui-date-period [start]="start" [end]="end" />`. It writes them like the uiDatePeriod
 * pipe, in the language of the app (LOCALE_ID). It is text, so it takes the look of what it is in.
 * Unset inputs fall back to the values provided with provideDatePeriodConfig.
 */
@Component({
    selector: 'ui-date-period',
    templateUrl: './date-period.component.html'
})
export class DatePeriodComponent {
    private readonly config: DatePeriodConfig = inject(DATE_PERIOD_CONFIG);
    private readonly locale: string = inject(LOCALE_ID);

    /**
     * When it started, or the date for a single one.
     */
    readonly start: InputSignal<DatePeriodDate> = input.required<DatePeriodDate>();

    /**
     * When it ended, 'open' for a period that is still going on, which shows the openEndLabel of
     * provideDatePeriodConfig, or undefined for a single date.
     */
    readonly end: InputSignal<DatePeriodEnd> = input<DatePeriodEnd>();

    /**
     * How the dates are written. The default comes from provideDatePeriodConfig.
     */
    readonly format: InputSignal<DatePeriodFormat> = input<DatePeriodFormat>(this.config.format);

    /**
     * What stands between the start and the end.
     */
    protected readonly separator: string = this.config.separator;

    /**
     * The start and, unless it is a single date, the end as they show.
     */
    protected readonly parts: Signal<DatePeriodPart[]> = computed(() => {
        return DatePeriodUtilities.resolveParts(this.start(), this.end(), this.format(), this.locale, this.config.openEndLabel);
    });
}