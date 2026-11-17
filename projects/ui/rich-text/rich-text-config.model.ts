import { RichTextSanitizer } from './rich-text-sanitizer.type';

/**
 * The values a rich text uses.
 */
export type RichTextConfig = {
    /**
     * Makes the html safe to show, in place of the sanitizer of Angular, which is strict: it removes ids, inline
     * styles and every element it doesn't know, like iframes. Undefined for the sanitizer of Angular.
     */
    sanitize: RichTextSanitizer | undefined
};