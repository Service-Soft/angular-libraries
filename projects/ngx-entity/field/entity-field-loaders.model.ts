import { Type } from '@angular/core';

import { EntityFieldKind } from './entity-field-kind.type';

/**
 * Loads the component of a kind of field, like `() => import('./my-date-field').then(m => m.MyDateFieldComponent)`.
 * The component takes the inputs of BaseEntityFieldDirective, best by extending it.
 */
export type EntityFieldLoader = () => Promise<Type<unknown>>;

/**
 * The loader of the component of every kind of field.
 */
export type EntityFieldLoaders = Record<EntityFieldKind, EntityFieldLoader>;