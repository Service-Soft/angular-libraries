import { IconDefinition } from '@service-soft/ui/icon';

/**
 * An entry of a byline of your own, after the ones it has itself, like the number of comments.
 */
export type BylineItem = {
    /**
     * What it says, like '12 comments'.
     */
    text: string,
    /**
     * An icon in front of the text, like faComment from '@fortawesome/free-solid-svg-icons'. Decorative, the text says
     * the same.
     */
    icon?: IconDefinition
};