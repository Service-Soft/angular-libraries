/**
 * Makes html safe to show, like DOMPurify.sanitize: it gets the html and returns it without anything that could run
 * code, like scripts or event handlers. The rich text trusts what it returns.
 */
export type RichTextSanitizer = (html: string) => string;