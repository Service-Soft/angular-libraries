import { IconDefinition } from '@service-soft/ui/icon';

/**
 * A section of a page the navigation links to, the element whose id is the fragment.
 */
export type NavAnchor = {
    /**
     * The text of the link.
     */
    name: string,
    /**
     * The id of the element of the section, without the '#'.
     */
    fragment: string,
    /**
     * An icon in front of the name, like faHouse from '@fortawesome/free-solid-svg-icons'.
     */
    icon?: IconDefinition
};