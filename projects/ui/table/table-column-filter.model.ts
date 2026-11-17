import { InputOption } from '@service-soft/ui/input';

/**
 * How a column of ui-table is filtered: by a text the user types, or by one of a few options, like a status.
 */
export type TableColumnFilter = {
    /**
     * A text, which the rows of the column contain.
     */
    type: 'text'
} | {
    /**
     * One of the options.
     */
    type: 'select',
    /**
     * The options, by their label. The empty choice filters nothing.
     */
    options: InputOption<unknown>[]
};