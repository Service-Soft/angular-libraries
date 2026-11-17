import { InputBooleanAppearance } from '@service-soft/ui/input';

import { ExtraPriceUnit } from './extra-price-unit.type';

/**
 * The texts of an extras input.
 */
export type InputExtrasLabels = {
    /**
     * What a price is for, after it, like '12.00 € per day'.
     */
    units: Record<ExtraPriceUnit, string>,
    /**
     * The name of the button that lowers a quantity by one, followed by the title of the extra.
     */
    decrease: string,
    /**
     * The name of the button that raises a quantity by one, followed by the title of the extra.
     */
    increase: string,
    /**
     * The line below the extras with the sum of the chosen ones.
     */
    total: string
};

/**
 * The values an extras input uses when its inputs are not set.
 */
export type InputExtrasConfig = {
    /**
     * Whether an extra that is on or off has a checkbox, or a switch.
     */
    appearance: InputBooleanAppearance,
    /**
     * Whether the sum of the chosen extras shows below them.
     */
    showTotal: boolean,
    /**
     * The texts of the input.
     */
    labels: InputExtrasLabels
};