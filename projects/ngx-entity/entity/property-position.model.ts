/**
 * Where a field shows in the form of its entity. A field without a position comes after the ones with one, in the order
 * of the properties of the class.
 */
export type PropertyPosition = {
    /**
     * The tab, from 1 on. A form whose fields are all on one tab shows no tabs.
     */
    tab?: number,
    /**
     * The label of the tab. One field of a tab is enough to name it.
     */
    tabName?: string,
    /**
     * The row inside the tab, from 1 on.
     */
    row?: number,
    /**
     * The order inside the row, from 1 on.
     */
    order?: number
};