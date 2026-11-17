import { ArrayPropertyMetadata, CustomPropertyMetadata, PropertyMetadata, StringPropertyMetadata } from '@service-soft/ngx-entity/entity';

import { EntityFieldKind } from './entity-field-kind.type';
import { EntityFieldLoader, EntityFieldLoaders } from './entity-field-loaders.model';

/**
 * Decides which field shows a property.
 */
export abstract class EntityFieldUtilities {
    /**
     * Resolves what loads the component of the field of a property: its own for a custom property, else the one of
     * its kind.
     * @param metadata - What the property says about itself.
     * @param loaders - The loaders of the kinds.
     * @returns The loader.
     */
    static resolveLoader<T>(metadata: PropertyMetadata<T>, loaders: EntityFieldLoaders): EntityFieldLoader {
        return metadata.type === 'custom' ? metadata.component : loaders[this.resolveKind(metadata)];
    }

    /**
     * Resolves the kind of the field of a property: a select for an enum, else by its type and display style. A
     * custom property has a component of its own instead.
     * @param metadata - What the property says about itself.
     * @returns The kind.
     */
    static resolveKind<T>(metadata: Exclude<PropertyMetadata<T>, CustomPropertyMetadata<T>>): EntityFieldKind {
        switch (metadata.type) {
            case 'string': {
                return this.resolveStringKind(metadata);
            }
            case 'number': {
                if (metadata.enum != undefined) {
                    return 'select';
                }
                return metadata.displayStyle === 'slider' ? 'slider' : 'number';
            }
            case 'boolean': {
                return 'boolean';
            }
            case 'date': {
                return 'date';
            }
            case 'dateRange': {
                return 'dateRange';
            }
            // an inline object is laid out by the form, with a field for each of its properties.
            case 'object': {
                return 'select';
            }
            case 'array': {
                return this.resolveArrayKind(metadata);
            }
            case 'manyToOne':
            case 'belongsToOne': {
                return 'reference';
            }
            case 'oneToMany': {
                return 'hasMany';
            }
        }
    }

    private static resolveStringKind<T>(metadata: StringPropertyMetadata<T>): EntityFieldKind {
        if (metadata.password) {
            return 'password';
        }
        if (metadata.enum != undefined) {
            return 'select';
        }
        switch (metadata.displayStyle) {
            case 'line': {
                return 'string';
            }
            case 'textarea':
            case 'autocomplete': {
                return metadata.displayStyle;
            }
        }
    }

    private static resolveArrayKind<T>(metadata: ArrayPropertyMetadata<T>): EntityFieldKind {
        switch (metadata.items.type) {
            case 'string':
            case 'number': {
                return 'chips';
            }
            case 'date':
            case 'dateRange': {
                return 'dateArray';
            }
            case 'object': {
                return 'objectArray';
            }
        }
    }
}