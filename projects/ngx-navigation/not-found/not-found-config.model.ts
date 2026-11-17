import { IconDefinition } from '@service-soft/ui/icon';

/**
 * What the page for unknown urls shows.
 */
export type NotFoundConfig = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * The text below the heading.
     */
    message: string,
    /**
     * The text of the link back.
     */
    homeLabel: string,
    /**
     * Where the link back goes.
     */
    homeRoute: string,
    /**
     * The icon above the heading.
     */
    icon: IconDefinition
};