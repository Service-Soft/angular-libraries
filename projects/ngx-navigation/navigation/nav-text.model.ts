import { NavConditional } from './nav-conditional.model';

/**
 * Plain text, like the copyright in the footer.
 */
export type NavText = NavConditional & {
    /**
     * Says that it is text.
     */
    type: 'text',
    /**
     * The text.
     */
    text: string
};