import { Type } from '@angular/core';

import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { EntityClass } from './entity-class.type';

/**
 * What a relation to many other entities that point back to this one says about itself, with every value set, like the
 * tasks of a project.
 */
export type OneToManyPropertyMetadata<T> = BasePropertyMetadata<T, never> & {
    /**
     * The kind of the relation.
     */
    type: 'oneToMany',
    /**
     * The class of the other entities.
     */
    target: () => EntityClass<object>,
    /**
     * The manyToOne property of the other entities that points back, like 'project', whose joinColumn they are filtered
     * and created with.
     */
    inverseSide: string,
    /**
     * The class of the EntityService of the other entities.
     */
    service: () => Type<unknown>,
    /**
     * The columns of the table of the other entities, by the keys of their properties.
     */
    columns: string[]
};

/**
 * What a relation to many other entities says about itself: its label, the other entities, and every other value that
 * differs from its default.
 */
export type OneToManyPropertyMetadataInput<T, R> = BasePropertyMetadataInput<T, never> & {
    /**
     * The class of the other entities, in a function, so the classes may point to each other.
     */
    target: () => EntityClass<R>,
    /**
     * The manyToOne property of the other entities that points back, like 'project'.
     */
    inverseSide: keyof R & string,
    /**
     * The class of the EntityService of the other entities, in a function. Its filter config has to take the
     * joinColumn of the inverse side with equals, which their table is filtered by.
     */
    service: () => Type<unknown>,
    /**
     * The columns of the table of the other entities, by the keys of their properties.
     */
    columns: (keyof R & string)[]
};