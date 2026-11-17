import { DetailsVariant } from '@service-soft/ui/details';

/**
 * The values a list of frequently asked questions uses when its inputs are not set.
 */
export type FaqConfig = {
    /**
     * How the questions look, like the variant of a details section.
     */
    variant: DetailsVariant,
    /**
     * Whether the questions and answers carry the schema.org microdata of an FAQPage, which search engines read.
     */
    microdata: boolean,
    /**
     * Whether only one answer shows at a time: opening a question closes the one that was open.
     */
    exclusive: boolean
};