import { inject, InjectionToken, Provider } from '@angular/core';

import { OrderSummaryConfigChanges } from './order-summary-config-changes.model';
import { OrderSummaryConfig } from './order-summary-config.model';

const DEFAULT_ORDER_SUMMARY_CONFIG: OrderSummaryConfig = {
    variant: 'compact',
    taxMode: 'gross',
    taxRate: undefined,
    labels: {
        caption: 'Order summary',
        item: 'Item',
        quantity: 'Quantity',
        unitPrice: 'Unit price',
        amount: 'Amount',
        subtotal: 'Subtotal',
        netTotal: 'Net total',
        tax: 'VAT',
        includedTax: 'Includes VAT',
        total: 'Total'
    }
};

/**
 * The values every order summary below this injector uses when its inputs are not set.
 * Change them with provideOrderSummaryConfig.
 */
export const ORDER_SUMMARY_CONFIG: InjectionToken<OrderSummaryConfig> = new InjectionToken<OrderSummaryConfig>(
    'ORDER_SUMMARY_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_ORDER_SUMMARY_CONFIG
    }
);

/**
 * Changes the values order summaries use when their inputs are not set, like the tax rate or the texts to translate
 * them. Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for ORDER_SUMMARY_CONFIG.
 */
export function provideOrderSummaryConfig(config: OrderSummaryConfigChanges): Provider {
    return {
        provide: ORDER_SUMMARY_CONFIG,
        useFactory: (): OrderSummaryConfig => {
            const parent: OrderSummaryConfig = inject(ORDER_SUMMARY_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_ORDER_SUMMARY_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}