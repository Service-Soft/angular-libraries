import { ArrayItemMetadata, ArrayItemMetadataInput, ArrayPropertyMetadataInput } from './array-property-metadata.model';
import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { BooleanPropertyMetadataInput } from './boolean-property-metadata.model';
import { CustomPropertyMetadataInput } from './custom-property-metadata.model';
import { DatePropertyMetadataInput } from './date-property-metadata.model';
import { DateRangePropertyMetadataInput } from './date-range-property-metadata.model';
import { EntityPropertyDecorator } from './entity-property-decorator.type';
import { EntityUtilities } from './entity.utilities';
import { NumberPropertyMetadata, NumberPropertyMetadataInput } from './number-property-metadata.model';
import { ObjectPropertyMetadataInput } from './object-property-metadata.model';
import { OneToManyPropertyMetadataInput } from './one-to-many-property-metadata.model';
import { PropertyMetadata } from './property-metadata.type';
import { PropertyRegistryUtilities } from './property-registry.utilities';
import { StringPropertyMetadataInput } from './string-property-metadata.model';
import { ToOnePropertyMetadataInput } from './to-one-property-metadata.model';

/**
 * The decorators that describe the properties of an entity class, named and configured like the ones of zibri, plus
 * what the form and the table need, like the label:
 * ```ts
 * class Task {
 *     @Property.string({ displayName: 'Title', minLength: 3 })
 *     title!: string;
 * }
 * ```
 * A condition that depends on the entity gets it typed by the class the decorator is in:
 * `@Property.boolean({ displayName: 'Done', readonly: task => task.archived })`.
 */
export abstract class Property {
    /**
     * Describes a string property.
     * @param data - The label, and every other value that differs from its default.
     * @returns The decorator.
     */
    static string<T extends object>(data: StringPropertyMetadataInput<T>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            type: 'string',
            displayStyle: 'line',
            format: undefined,
            minLength: undefined,
            maxLength: undefined,
            regex: undefined,
            enum: undefined,
            options: undefined,
            restrictToOptions: false,
            password: false,
            confirmation: true,
            confirmationDisplayName: undefined,
            passwordStrength: true,
            ...data
        });
    }

    /**
     * Describes a number property. A slider without a default starts at its min.
     * @param data - The label, and every other value that differs from its default.
     * @returns The decorator.
     * @throws {Error} When it is a slider without a min and a max.
     */
    static number<T extends object>(data: NumberPropertyMetadataInput<T>): EntityPropertyDecorator<T> {
        const metadata: NumberPropertyMetadata<T> = {
            ...this.resolveBase(data),
            type: 'number',
            displayStyle: 'line',
            format: 'number',
            min: undefined,
            max: undefined,
            enum: undefined,
            ...data
        };
        if (metadata.displayStyle !== 'slider') {
            return this.resolveDecorator<T>(metadata);
        }
        // a slider has no end without them, and the browser would make one up.
        if (metadata.min == undefined || metadata.max == undefined) {
            throw new Error(`The slider "${metadata.displayName}" needs a min and a max.`);
        }
        // a slider always shows a value, so a new entity sends the one it shows rather than nothing.
        return this.resolveDecorator<T>({ ...metadata, default: metadata.default ?? metadata.min });
    }

    /**
     * Describes a boolean property. It is false by default.
     * @param data - The label, and every other value that differs from its default.
     * @returns The decorator.
     */
    static boolean<T extends object>(data: BooleanPropertyMetadataInput<T>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            type: 'boolean',
            displayStyle: undefined,
            mustBeChecked: false,
            // a checkbox the user never touched is unchecked, so a new entity sends false rather than nothing.
            default: false,
            ...data
        });
    }

    /**
     * Describes a date property.
     * @param data - The label, and every other value that differs from its default.
     * @returns The decorator.
     */
    static date<T extends object>(data: DatePropertyMetadataInput<T>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            type: 'date',
            displayStyle: 'date',
            after: undefined,
            before: undefined,
            ...data
        });
    }

    /**
     * Describes a date range property, like the stay of a booking: a DateRange from a start to an end, which on the
     * server is an object with these two dates. The field has an input for each, the end not before the start.
     * @param data - The label, and every other value that differs from its default.
     * @returns The decorator.
     */
    static dateRange<T extends object>(data: DateRangePropertyMetadataInput<T>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            type: 'dateRange',
            displayStyle: 'date',
            after: undefined,
            before: undefined,
            ...data
        });
    }

    /**
     * Describes a property with a field of its own, a component that extends BaseEntityFieldDirective, loaded the first
     * time a form shows it: `component: async () => (await import('./color-field.component')).ColorFieldComponent`.
     * `data` is whatever else the component needs, which it reads from the metadata of its property.
     * @param data - The label, the component, and every other value that differs from its default.
     * @returns The decorator.
     */
    static custom<T extends object, V = unknown>(data: CustomPropertyMetadataInput<T, V>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({ ...this.resolveBase(data), data: undefined, ...data, type: 'custom' });
    }

    /**
     * Describes an object property, like the address of a customer, whose class has decorated properties of its own.
     * The form shows their fields inside a group with its label, the problems of the server at them by their path,
     * like 'address.city'. With displayStyle 'dropdown' it is a select of fixed objects instead. A new entity starts
     * with the defaults of the class, or of the property. An object that isn't required starts empty instead: its fields
     * are only required once one of them has a value, and an empty one is left out.
     * @param data - The label, the class, the options of a select, and every other value that differs from its default.
     * @returns The decorator.
     */
    static object<T extends object, O extends object>(data: ObjectPropertyMetadataInput<T, O>): EntityPropertyDecorator<T> {
        const base: BasePropertyMetadata<T, O> = this.resolveBase(data);
        if (data.displayStyle === 'dropdown') {
            return this.resolveDecorator<T>({ ...base, ...data, type: 'object' });
        }
        return this.resolveDecorator<T>({
            ...base,
            defaultWidths: [12, 12, 12],
            // the defaults would fill an object the user may leave empty.
            default: data.required === false ? undefined : () => EntityUtilities.resolveDefaults(data.cls()),
            ...data,
            type: 'object',
            displayStyle: 'inline',
            options: undefined
        });
    }

    /**
     * Describes an array property, like zibri's, by what its items are: strings and numbers show as chips, dates and
     * date ranges in a table with the inputs that add one, objects in a table whose dialog has the fields of their class.
     * A new entity starts with an empty array, which is a value, so an array isn't required by default; a required one
     * needs an item.
     * @param data - The label, the items, and every other value that differs from its default.
     * @returns The decorator.
     */
    static array<T extends object, O extends object = object>(data: ArrayPropertyMetadataInput<T, O>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            required: false,
            // a table of items needs the width of the form.
            defaultWidths: data.items.type === 'string' || data.items.type === 'number' ? [6, 6, 12] : [12, 12, 12],
            default: () => [],
            ...data,
            type: 'array',
            items: this.resolveItems(data.items)
        });
    }

    /**
     * Describes a relation to the one entity this entity points to, among many that can point to it, like the team of
     * a task. The form picks it, and keeps its id in the joinColumn.
     * @param data - The label, the other entity, its service, and every other value that differs from its default.
     * @returns The decorator.
     */
    static manyToOne<T extends object, R extends object>(data: ToOnePropertyMetadataInput<T, R>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({ ...this.resolveBase(data), ...data, type: 'manyToOne' });
    }

    /**
     * Describes a relation to the one entity this entity belongs to, which keeps its id, like the user of a profile.
     * The form picks it, and keeps its id in the joinColumn.
     * @param data - The label, the other entity, its service, and every other value that differs from its default.
     * @returns The decorator.
     */
    static belongsToOne<T extends object, R extends object>(data: ToOnePropertyMetadataInput<T, R>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({ ...this.resolveBase(data), ...data, type: 'belongsToOne' });
    }

    /**
     * Describes a relation to the many entities that point to this one through their manyToOne, like the tasks of a
     * project. The form of an existing entity shows them in a table, which creates, edits and deletes them. It is
     * never required, and never sent with the entity.
     * @param data - The label, the other entities, their service and columns, and every other value that differs from
     * its default.
     * @returns The decorator.
     */
    static oneToMany<T extends object, R extends object>(data: OneToManyPropertyMetadataInput<T, R>): EntityPropertyDecorator<T> {
        return this.resolveDecorator<T>({
            ...this.resolveBase(data),
            required: false,
            defaultWidths: [12, 12, 12],
            ...data,
            type: 'oneToMany'
        });
    }

    private static resolveBase<T, V>(data: BasePropertyMetadataInput<T, V>): BasePropertyMetadata<T, V> {
        return {
            description: undefined,
            required: true,
            display: true,
            readonly: false,
            omitForCreate: false,
            omitForUpdate: false,
            defaultWidths: [6, 6, 12],
            position: {},
            default: undefined,
            ...data
        };
    }

    private static resolveItems<T, O extends object>(items: ArrayItemMetadataInput<T, O>): ArrayItemMetadata<T> {
        switch (items.type) {
            case 'string': {
                return {
                    enum: undefined,
                    options: undefined,
                    restrictToOptions: false,
                    minLength: undefined,
                    maxLength: undefined,
                    regex: undefined,
                    ...items
                };
            }
            case 'number': {
                return { enum: undefined, format: 'number', min: undefined, max: undefined, ...items };
            }
            case 'date':
            case 'dateRange': {
                return { displayStyle: 'date', after: undefined, before: undefined, ...items };
            }
            case 'object': {
                return { columns: undefined, ...items };
            }
        }
    }

    private static resolveDecorator<T extends object>(metadata: PropertyMetadata<T>): EntityPropertyDecorator<T> {
        return (prototype, key) => PropertyRegistryUtilities.register(prototype, key, metadata);
    }
}