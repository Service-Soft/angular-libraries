import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';
import { MoneyUtilities } from '@service-soft/ngx-ecommerce/money';
import { PRICE_CONFIG } from '@service-soft/ui/price';

import { OrderSummaryConfig, OrderSummaryLabels } from './order-summary-config.model';
import { ORDER_SUMMARY_CONFIG } from './order-summary-config.provider';
import { OrderSummaryDiscount } from './order-summary-discount.model';
import { OrderSummaryItem } from './order-summary-item.model';
import { OrderSummaryLineView } from './order-summary-line-view.model';
import { OrderSummaryRowView } from './order-summary-row-view.model';
import { OrderSummaryTaxMode } from './order-summary-tax-mode.type';
import { OrderSummaryTax } from './order-summary-tax.model';
import { OrderSummaryTotals } from './order-summary-totals.model';
import { OrderSummaryVariant } from './order-summary-variant.type';
import { OrderSummaryUtilities } from './order-summary.utilities';

// every row below the items is a row header and its amount. The total stands out by its weight and the line above it,
// not by a color. The notes, like the tax a gross total includes, are smaller and in on-surface-variant, whose contrast
// on the surface is checked.
const ROW_CLASSES: Record<'line' | 'total' | 'note', string> = {
    line: '*:py-1 *:font-normal',
    total: 'border-t border-outline *:pt-2 *:pb-1 *:font-semibold',
    note: 'text-body-sm text-on-surface-variant *:py-0.5 *:font-normal'
};

/**
 * The items of an order with their quantities and totals, and below them the subtotal, discounts, taxes and the total,
 * like in a checkout or on a confirmation page. Amounts are integers in the minor unit of the currency, like cents, and
 * are written with Intl in the language of the app (LOCALE_ID). Compact, each item shows its quantity and total;
 * detailed, also its unit price, its description and the net total.
 * It is a native table, which screen readers read with the heading of each column and row. Put a heading of your own
 * above it, in the level that fits the page.
 * Unset inputs fall back to the values provided with provideOrderSummaryConfig, the currency to the one of
 * providePriceConfig, which the prices of ui use as well.
 */
@Component({
    selector: 'ngx-order-summary',
    templateUrl: './order-summary.component.html',
    host: {
        class: 'block'
    }
})
export class OrderSummaryComponent {
    private readonly config: OrderSummaryConfig = inject(ORDER_SUMMARY_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The texts of the summary.
     */
    protected readonly labels: OrderSummaryLabels = this.config.labels;

    /**
     * The items of the order, in the order they show.
     */
    readonly items: InputSignal<OrderSummaryItem[]> = input.required<OrderSummaryItem[]>();

    /**
     * The discounts on the whole order, like a voucher, shown below the subtotal.
     */
    readonly discounts: InputSignal<OrderSummaryDiscount[]> = input<OrderSummaryDiscount[]>([]);

    /**
     * How much the summary shows. The default comes from provideOrderSummaryConfig.
     */
    readonly variant: InputSignal<OrderSummaryVariant> = input<OrderSummaryVariant>(this.config.variant);

    /**
     * Whether the prices include the tax (gross) or the tax is added to them (net). The default comes from
     * provideOrderSummaryConfig.
     */
    readonly taxMode: InputSignal<OrderSummaryTaxMode> = input<OrderSummaryTaxMode>(this.config.taxMode);

    /**
     * The tax rate in percent of items that don't have their own, like 19. Without one, they aren't taxed. The default
     * comes from provideOrderSummaryConfig.
     */
    readonly taxRate: InputSignal<number | undefined> = input<number | undefined>(this.config.taxRate);

    /**
     * The ISO 4217 code of the currency of every amount, like 'EUR'. The default comes from providePriceConfig of
     * `@service-soft/ui/price`.
     */
    // one currency for the whole app, which ui-price shows its amounts in as well.
    readonly currency: InputSignal<string> = input<string>(inject(PRICE_CONFIG).currency);

    /**
     * Whether the summary is detailed.
     */
    protected readonly detailed: Signal<boolean> = computed(() => this.variant() === 'detailed');

    /**
     * How many columns the label of a row below the items spans: every column but the one of the amounts.
     */
    protected readonly labelColumns: Signal<number> = computed(() => this.detailed() ? 3 : 1);

    /**
     * The amounts of the order.
     */
    protected readonly totals: Signal<OrderSummaryTotals> = computed(
        () => OrderSummaryUtilities.calculateTotals(this.items(), this.discounts(), this.taxMode(), this.taxRate())
    );

    /**
     * The items, written in the language of the app.
     */
    protected readonly lines: Signal<OrderSummaryLineView[]> = computed(() => {
        const quantityFormat: Intl.NumberFormat = new Intl.NumberFormat(this.locale);
        const lineTotals: number[] = this.totals().lines;
        return this.items().map((item, index) => ({
            label: item.label,
            description: item.description,
            quantity: quantityFormat.format(item.quantity),
            unitPrice: this.formatAmount(item.unitPrice),
            total: this.formatAmount(lineTotals[index] ?? 0)
        }));
    });

    /**
     * The rows below the items, from the subtotal to the total, written in the language of the app.
     */
    protected readonly rows: Signal<OrderSummaryRowView[]> = computed(() => {
        const totals: OrderSummaryTotals = this.totals();
        // the minus says it is taken off, not only a color.
        const discounts: OrderSummaryRowView[] = this.discounts()
            .map((discount, index) => this.toRow(discount.label, -(totals.discounts[index] ?? 0), ROW_CLASSES.line));
        // only when something between them makes the total differ, the same amount twice says nothing.
        const subtotal: OrderSummaryRowView[] = totals.subtotal === totals.total
            ? []
            : [this.toRow(this.labels.subtotal, totals.subtotal, ROW_CLASSES.line)];
        const total: OrderSummaryRowView = this.toRow(this.labels.total, totals.total, ROW_CLASSES.total);
        const showsNet: boolean = this.detailed() && totals.net !== totals.subtotal && totals.net !== totals.total;

        // like on an invoice: net prices add the taxes before the total, gross prices say below it what they include.
        if (this.taxMode() === 'net') {
            const net: OrderSummaryRowView[] = showsNet ? [this.toRow(this.labels.netTotal, totals.net, ROW_CLASSES.line)] : [];
            return [...subtotal, ...discounts, ...net, ...this.toTaxRows(totals.taxes, this.labels.tax, ROW_CLASSES.line), total];
        }
        const net: OrderSummaryRowView[] = showsNet ? [this.toRow(this.labels.netTotal, totals.net, ROW_CLASSES.note)] : [];
        return [...subtotal, ...discounts, total, ...net, ...this.toTaxRows(totals.taxes, this.labels.includedTax, ROW_CLASSES.note)];
    });

    private toTaxRows(taxes: OrderSummaryTax[], label: string, classes: string): OrderSummaryRowView[] {
        const rateFormat: Intl.NumberFormat = new Intl.NumberFormat(this.locale, { style: 'percent', maximumFractionDigits: 2 });
        return taxes.map(tax => this.toRow(`${label} ${rateFormat.format(tax.rate / 100)}`, tax.amount, classes));
    }

    private toRow(label: string, amount: number, classes: string): OrderSummaryRowView {
        return { label, amount: this.formatAmount(amount), classes };
    }

    private formatAmount(amount: number): string {
        return MoneyUtilities.format(amount, this.currency(), this.locale);
    }
}