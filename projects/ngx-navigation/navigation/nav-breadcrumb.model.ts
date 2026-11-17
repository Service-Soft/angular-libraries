import { IconDefinition } from '@service-soft/ui/icon';

/**
 * A step of the breadcrumbs of the current page.
 */
export type NavBreadcrumb = {
    /**
     * The name of the step.
     */
    name: string,
    /**
     * The absolute url of the step, like '/orders/1001'.
     */
    url: string,
    /**
     * An icon in front of the name.
     */
    icon?: IconDefinition,
    /**
     * Whether it is the current page, which is the last step.
     */
    isCurrent: boolean
};