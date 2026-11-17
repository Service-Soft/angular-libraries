import { IconDefinition } from '@service-soft/ui/icon';

/**
 * A tile of a filter, like a category of a list: the value it stands for and what it shows.
 */
export type FilterTileOption<T> = {
    /**
     * The value it stands for, like the id of the category. Compared with ===.
     */
    value: T,
    /**
     * What it is called, like 'Implants'.
     */
    label: string,
    /**
     * An icon above the label, like faTooth from '@fortawesome/free-solid-svg-icons'. Decorative, the label says the
     * same.
     */
    icon?: IconDefinition,
    /**
     * How many items it has, shown below the label.
     */
    count?: number
};