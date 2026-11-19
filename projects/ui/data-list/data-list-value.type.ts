import { TemplateRef } from '@angular/core';

/**
 * What a data list shows for a label: a text as it is, a number or a date in the language of the app, or a template
 * for anything else, like a list of links. Nothing shows for undefined.
 */
export type DataListValue = string | number | Date | TemplateRef<unknown> | undefined;