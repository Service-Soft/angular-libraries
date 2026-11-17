import { TemplateRef } from '@angular/core';

/**
 * A footnote as its list shows it.
 */
export type FootnoteView = {
    /**
     * Its number, starting at 1.
     */
    number: number,
    /**
     * The id of its item in the list.
     */
    id: string,
    /**
     * The id of its text, which describes its reference.
     */
    textId: string,
    /**
     * The href of the link back to its reference.
     */
    referenceHref: string,
    /**
     * The name of the link back to its reference.
     */
    backLabel: string,
    /**
     * Its content.
     */
    content: TemplateRef<unknown>
};