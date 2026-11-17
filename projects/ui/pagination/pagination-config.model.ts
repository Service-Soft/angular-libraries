import { PaginationColor } from './pagination-color.type';

/**
 * The values a pagination uses when its inputs are not set, and its texts.
 */
export type PaginationConfig = {
    /**
     * The color of the button of the current page, and of the text of the other buttons.
     */
    color: PaginationColor,
    /**
     * What screen readers call the navigation, like 'Pages of the logs' when a page has more than one.
     */
    label: string,
    /**
     * The name of the button that goes to the first page.
     */
    firstLabel: string,
    /**
     * The name of the button that goes to the page before.
     */
    previousLabel: string,
    /**
     * The name of the button that goes to the page after.
     */
    nextLabel: string,
    /**
     * The name of the button that goes to the last page.
     */
    lastLabel: string,
    /**
     * The name of the button of a page, from its number, which it shows.
     */
    pageLabel: (page: number) => string
};