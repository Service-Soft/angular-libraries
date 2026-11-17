import { IconDefinition } from '@service-soft/ui/icon';
import { InputOption } from '@service-soft/ui/input';

import { InputCardImage } from './input-card-image.model';

/**
 * One of the options of a cards input, shown as a card: its label as the title, a description below it, and an image
 * at the top or an icon in front of the title.
 */
export type InputCardOption<T> = InputOption<T> & {
    /**
     * More about the option, below its title, like what a car includes.
     */
    description?: string,
    /**
     * A picture at the top of the card.
     */
    image?: InputCardImage,
    /**
     * An icon in front of the title.
     */
    icon?: IconDefinition
};