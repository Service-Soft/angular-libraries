import { InjectionToken, Type } from '@angular/core';

/**
 * The component of entity forms, which the form provides to its fields, so a field can show the fields of an object in
 * a dialog, like the one of an item of an array, without importing the form. It takes the inputs `entity` and `mode`,
 * and binds `value` two-way.
 */
export const ENTITY_FORM_COMPONENT: InjectionToken<Type<unknown>> = new InjectionToken<Type<unknown>>('ENTITY_FORM_COMPONENT');