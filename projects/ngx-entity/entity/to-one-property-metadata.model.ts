import { Type } from '@angular/core';

import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { EntityClass } from './entity-class.type';

/**
 * The relations of zibri in which an entity keeps the id of another one: manyToOne, like the team of a task, among many
 * tasks of a team, and belongsToOne, like the profile that belongs to one user.
 */
export type ToOneRelation = 'manyToOne' | 'belongsToOne';

/**
 * What a relation to one other entity says about itself, with every value set.
 */
export type ToOnePropertyMetadata<T> = BasePropertyMetadata<T, never> & {
    /**
     * The kind of the relation.
     */
    type: ToOneRelation,
    /**
     * The class of the other entity.
     */
    target: () => EntityClass<object>,
    /**
     * The property that keeps the id of the other entity, like 'teamId', which the form edits.
     */
    joinColumn: string,
    /**
     * The class of the EntityService of the other entity, which finds the entities to choose from.
     */
    service: () => Type<unknown>,
    /**
     * The property of the other entity that names it, like 'name'. The user searches by it, so the filter config of its
     * service has to match it, like with iLike.
     */
    label: string
};

/**
 * What a relation to one other entity says about itself: its label, the other entity, and every other value that
 * differs from its default.
 */
export type ToOnePropertyMetadataInput<T, R> = BasePropertyMetadataInput<T, never> & {
    /**
     * The class of the other entity, in a function, so the classes may point to each other.
     */
    target: () => EntityClass<R>,
    /**
     * The property that keeps the id of the other entity, like 'teamId', which the entity declares as well.
     */
    joinColumn: keyof T & string,
    /**
     * The class of the EntityService of the other entity, in a function, which finds the entities to choose from.
     */
    service: () => Type<unknown>,
    /**
     * The property of the other entity that names it, like 'name'. The user searches by it, so the filter config of its
     * service has to match it, like with iLike.
     */
    label: keyof R & string
};