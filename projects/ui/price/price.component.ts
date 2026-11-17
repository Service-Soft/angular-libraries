import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';

import { PriceConfig } from './price-config.model';
import { PRICE_CONFIG } from './price-config.provider';
import { PriceSize } from './price-size.type';

const AMOUNT_CLASSES: Record<PriceSize, string> = {
    md: 'font-heading text-title',
    lg: 'font-heading text-display'
};

/**
 * A price, written with Intl in the language of the app (LOCALE_ID) and its currency, optionally per a period and next
 * to an old price that is struck through: `<ui-price [amount]="49" period="month" [oldAmount]="59" />` shows
 * '€49.00 / month €59.00' and is read as '€49.00 per month, previously €59.00'.
 * Unset inputs fall back to the values provided with providePriceConfig.
 */
@Component({
    selector: 'ui-price',
    templateUrl: './price.component.html',
    host: {
        // the period and the old price stand on the baseline of the amount, and wrap below it where it is narrow.
        class: 'inline-flex flex-wrap items-baseline gap-x-2 gap-y-1'
    }
})
export class PriceComponent {
    private readonly config: PriceConfig = inject(PRICE_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The amount, like 49 or 9.99.
     */
    readonly amount: InputSignal<number> = input.required<number>();

    /**
     * What the amount is paid for, like 'month', which shows as '/ month'. Without one, it is a single payment.
     */
    readonly period: InputSignal<string | undefined> = input<string>();

    /**
     * The price before, like before a discount, which shows struck through.
     */
    readonly oldAmount: InputSignal<number | undefined> = input<number>();

    /**
     * The currency, as an ISO 4217 code like 'EUR' or 'USD'. The default comes from providePriceConfig.
     */
    readonly currency: InputSignal<string> = input<string>(this.config.currency);

    /**
     * How the amounts are written, on top of the currency, like `{ maximumFractionDigits: 0 }` for '€49'. The default
     * comes from providePriceConfig.
     */
    readonly format: InputSignal<Intl.NumberFormatOptions> = input<Intl.NumberFormatOptions>(this.config.format);

    /**
     * How large the amount is: the size of a title, or the largest text of the page. The default comes from
     * providePriceConfig.
     */
    readonly size: InputSignal<PriceSize> = input<PriceSize>(this.config.size);

    /**
     * The texts screen readers read for the period and the old price.
     */
    protected readonly labels: PriceConfig = this.config;

    private readonly formatter: Signal<Intl.NumberFormat> = computed(() => {
        return new Intl.NumberFormat(this.locale, { ...this.format(), style: 'currency', currency: this.currency() });
    });

    /**
     * The amount as it shows.
     */
    protected readonly formattedAmount: Signal<string> = computed(() => this.formatter().format(this.amount()));

    /**
     * The old amount as it shows, if there is one.
     */
    protected readonly formattedOldAmount: Signal<string | undefined> = computed(() => {
        const oldAmount: number | undefined = this.oldAmount();
        return oldAmount == undefined ? undefined : this.formatter().format(oldAmount);
    });

    /**
     * The tailwind classes of the amount.
     */
    protected readonly amountClasses: Signal<string> = computed(() => AMOUNT_CLASSES[this.size()]);
}