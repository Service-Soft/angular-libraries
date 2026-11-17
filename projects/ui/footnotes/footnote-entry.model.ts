import { Signal, TemplateRef } from '@angular/core';

/**
 * A footnote as its list knows it: where its reference is in the text, which gives its number, and its content.
 */
export type FootnoteEntry = {
    /**
     * The element of the reference, whose place in the page decides the number.
     */
    element: HTMLElement,
    /**
     * The content of the footnote, which the list shows.
     */
    content: Signal<TemplateRef<unknown>>
};