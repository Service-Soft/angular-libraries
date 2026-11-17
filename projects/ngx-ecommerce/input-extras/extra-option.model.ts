import { IconDefinition } from '@service-soft/ui/icon';
import { InputCardImage } from '@service-soft/ui/input-cards';

import { ExtraOptionType } from './extra-option-type.type';
import { ExtraPriceUnit } from './extra-price-unit.type';

/**
 * An extra of a booking or order, like breakfast or a bike, shown as a card.
 */
export type ExtraOption = {
    /**
     * What identifies it in the value, like 'breakfast'.
     */
    id: string,
    /**
     * Its title, which names its checkbox or quantity.
     */
    label: string,
    /**
     * More about it, below its title.
     */
    description?: string,
    /**
     * A picture in front of the title.
     */
    image?: InputCardImage,
    /**
     * An icon in front of the title, decorative like the picture: the title says what it is.
     */
    icon?: IconDefinition,
    /**
     * The price in the minor unit of the currency, like 1200 for 12.00 €.
     */
    price: number,
    /**
     * What the price is for: once, for each one, or for each one and each day of the booking.
     */
    unit: ExtraPriceUnit,
    /**
     * Whether it is on or off, or has a quantity.
     */
    type: ExtraOptionType,
    /**
     * The least quantity once it is chosen, like 2 for bikes that are only rented in pairs. 0 is always allowed and
     * means it isn't chosen: adding one to it takes the min, removing one from the min leaves it out again.
     */
    min?: number,
    /**
     * The largest quantity, unlimited by default.
     */
    max?: number,
    /**
     * Whether it can't be changed, like when it is sold out.
     */
    disabled?: boolean
};