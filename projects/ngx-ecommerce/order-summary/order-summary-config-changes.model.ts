import { OrderSummaryConfig, OrderSummaryLabels } from './order-summary-config.model';

/**
 * The values to change in the config of order summaries. Everything is optional, including every single label.
 */
export type OrderSummaryConfigChanges = Partial<Omit<OrderSummaryConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<OrderSummaryLabels>
};