import { ButtonVariant } from '@service-soft/ui/button';

/**
 * The button of a page in a pagination.
 */
export type PaginationItem = {
    /**
     * The page, from 1 on.
     */
    page: number,
    /**
     * The name of the button.
     */
    label: string,
    /**
     * How the button is drawn: filled for the current page, which sets it apart by its shape, not only its color.
     */
    variant: ButtonVariant,
    /**
     * 'page' for the button of the current page, which screen readers announce.
     */
    ariaCurrent?: 'page'
};