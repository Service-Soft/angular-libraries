import { IconDefinition } from '@service-soft/ui/icon';

/**
 * A button of a person card that calls or writes the person.
 */
export type PersonCardContact = {
    /**
     * Where the button leads, like 'tel:+491711234567'.
     */
    href: string,
    /**
     * The text of the button, like the phone number as it is written.
     */
    text: string,
    /**
     * The icon before the text.
     */
    icon: IconDefinition
};