import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityFieldLoaders } from './entity-field-loaders.model';

// each field is its own chunk, which a form only loads once it shows a property of that kind.
const DEFAULT_ENTITY_FIELDS: EntityFieldLoaders = {
    string: async () => (await import('@service-soft/ngx-entity/field-string')).EntityStringFieldComponent,
    password: async () => (await import('@service-soft/ngx-entity/field-password')).EntityPasswordFieldComponent,
    textarea: async () => (await import('@service-soft/ngx-entity/field-textarea')).EntityTextareaFieldComponent,
    autocomplete: async () => (await import('@service-soft/ngx-entity/field-autocomplete')).EntityAutocompleteFieldComponent,
    dateRange: async () => (await import('@service-soft/ngx-entity/field-date-range')).EntityDateRangeFieldComponent,
    select: async () => (await import('@service-soft/ngx-entity/field-select')).EntitySelectFieldComponent,
    number: async () => (await import('@service-soft/ngx-entity/field-number')).EntityNumberFieldComponent,
    slider: async () => (await import('@service-soft/ngx-entity/field-slider')).EntitySliderFieldComponent,
    boolean: async () => (await import('@service-soft/ngx-entity/field-boolean')).EntityBooleanFieldComponent,
    date: async () => (await import('@service-soft/ngx-entity/field-date')).EntityDateFieldComponent,
    chips: async () => (await import('@service-soft/ngx-entity/field-chips')).EntityChipsFieldComponent,
    dateArray: async () => (await import('@service-soft/ngx-entity/field-date-array')).EntityDateArrayFieldComponent,
    objectArray: async () => (await import('@service-soft/ngx-entity/field-object-array')).EntityObjectArrayFieldComponent,
    reference: async () => (await import('@service-soft/ngx-entity/field-reference')).EntityReferenceFieldComponent,
    // its table creates and edits in dialogs, which hold a form, which loads the fields: importing it here would be a
    // cycle of entry points, which ng-packagr refuses, also for a dynamic import. So the app gives it.
    hasMany: async () => await Promise.reject(new Error(
        'A relation to many entities needs its field in the app config: provideEntityFields({ hasMany: async () => '
        + '(await import(\'@service-soft/ngx-entity/field-has-many\')).EntityHasManyFieldComponent }).'
    ))
};

/**
 * The components the fields of entity forms below this injector use, by their kind, loaded when a form first shows one.
 * Change them with provideEntityFields.
 */
export const ENTITY_FIELDS: InjectionToken<EntityFieldLoaders> = new InjectionToken<EntityFieldLoaders>('ENTITY_FIELDS', {
    providedIn: 'root',
    factory: () => DEFAULT_ENTITY_FIELDS
});

/**
 * Replaces the components of kinds of fields with your own, like a date field with a calendar:
 * `provideEntityFields({ date: () => import('./my-date-field').then(m => m.MyDateFieldComponent) })`.
 * Kinds you leave out are taken from the parent injector. Load them with an import(), so only the forms that show the
 * kind load the component.
 * @param fields - The loaders of the kinds to replace.
 * @returns The provider for ENTITY_FIELDS.
 */
export function provideEntityFields(fields: Partial<EntityFieldLoaders>): Provider {
    return {
        provide: ENTITY_FIELDS,
        useFactory: (): EntityFieldLoaders => ({
            ...inject(ENTITY_FIELDS, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_FIELDS,
            ...fields
        })
    };
}