import { FilterConfig, FilterValue, OrderConfig, OrderValue } from 'zibri-contract';

/**
 * What a page of entities is asked for by: its number and size, and what the list is filtered and ordered by.
 */
export type EntityPageQuery<T, F extends FilterConfig<T>, O extends OrderConfig<T>> = {
    /**
     * The page, from 1 on.
     */
    page: number,
    /**
     * How many entities a page has.
     */
    limit: number,
    /**
     * What the list is filtered by. Empty values filter nothing.
     */
    filter?: FilterValue<T, F>,
    /**
     * What the list is ordered by, the first property first.
     */
    order?: OrderValue<T, O>
};