import { RichTextDomPurifyWindow } from './rich-text-dom-purify-window.type';

/**
 * What provideRichTextDomPurify takes of DOMPurify: the default export of 'dompurify', which creates a DOMPurify for a
 * window. Its own type, so @service-soft/ui doesn't depend on dompurify, and your app decides its version.
 */
export type RichTextDomPurify<Config extends object> = (window: RichTextDomPurifyWindow) => {
    /**
     * Sanitizes html.
     * @param html - The html.
     * @param config - How it sanitizes, like which elements it allows.
     * @returns The html that is safe to show.
     */
    sanitize: (html: string, config?: Config) => string
};