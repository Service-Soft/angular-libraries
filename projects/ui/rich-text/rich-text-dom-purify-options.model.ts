import { RichTextDomPurifyWindow } from './rich-text-dom-purify-window.type';

/**
 * How provideRichTextDomPurify sanitizes.
 */
export type RichTextDomPurifyOptions<Config extends object> = {
    /**
     * The config of DOMPurify, like { ADD_TAGS: ['iframe'] }.
     */
    config?: Config,
    /**
     * A window to sanitize in when the page is rendered on the server, which has no window of its own, like
     * `new JSDOM('').window`. Without one, the sanitizer of Angular sanitizes there.
     */
    serverWindow?: RichTextDomPurifyWindow
};