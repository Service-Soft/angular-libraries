import { TemplateRef } from '@angular/core';

/**
 * An item of a data list as it shows: its label, and its value either written as text or as a template.
 */
export type DataListShownItem = {
    /**
     * What the value is.
     */
    label: string,
    /**
     * The value written as text, in the language of the app. Empty for a template.
     */
    text: string,
    /**
     * The template that shows the value, if it is one.
     */
    template: TemplateRef<unknown> | undefined
};
