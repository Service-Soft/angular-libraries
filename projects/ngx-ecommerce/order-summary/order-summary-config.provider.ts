import { inject, InjectionToken, Provider } from '@angular/core';

import { OrderSummaryConfigChanges } from './order-summary-config-changes.model';
import { OrderSummaryConfig } from './order-summary-config.model';

/**
 * The values of an order summary when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultOrderSummaryConfig(): OrderSummaryConfig {
    return {
        variant: 'compact',
        taxMode: 'gross',
        taxRate: undefined,
        labels: {
            caption: $localize`:@@ngx-ecommerce.order-summary.caption:Order summary`,
            item: $localize`:@@ngx-ecommerce.order-summary.item:Item`,
            quantity: $localize`:@@ngx-ecommerce.order-summary.quantity:Quantity`,
            unitPrice: $localize`:@@ngx-ecommerce.order-summary.unitPrice:Unit price`,
            amount: $localize`:@@ngx-ecommerce.order-summary.amount:Amount`,
            subtotal: $localize`:@@ngx-ecommerce.order-summary.subtotal:Subtotal`,
            netTotal: $localize`:@@ngx-ecommerce.order-summary.netTotal:Net total`,
            tax: $localize`:@@ngx-ecommerce.order-summary.tax:VAT`,
            includedTax: $localize`:@@ngx-ecommerce.order-summary.includedTax:Includes VAT`,
            total: $localize`:@@ngx-ecommerce.order-summary.total:Total`
        }
    };
}

/**
 * The values every order summary below this injector uses when its inputs are not set.
 * Change them with provideOrderSummaryConfig.
 */
export const ORDER_SUMMARY_CONFIG: InjectionToken<OrderSummaryConfig> = new InjectionToken<OrderSummaryConfig>(
    'ORDER_SUMMARY_CONFIG',
    {
        providedIn: 'root',
        factory: () => getDefaultOrderSummaryConfig()
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
                ?? getDefaultOrderSummaryConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}