import { ArrayItemMetadata } from './array-property-metadata.model';
import { EntityClass } from './entity-class.type';
import { EntityCondition } from './entity-condition.type';
import { EntityProperty } from './entity-property.model';
import { EnumMember } from './enum-member.model';
import { PropertyMetadata } from './property-metadata.type';
import { PropertyRegistryUtilities } from './property-registry.utilities';
import { ToOnePropertyMetadata } from './to-one-property-metadata.model';

/**
 * Reads what the decorators of an entity class say, and works with its entities by it.
 */
export abstract class EntityUtilities {
    /**
     * Resolves the properties of an entity class, those of the classes it extends first, in the order they are declared.
     * @param entity - The class.
     * @returns The properties.
     */
    static resolveProperties<T>(entity: EntityClass<T>): EntityProperty<T>[] {
        return PropertyRegistryUtilities.resolveProperties(entity);
    }

    /**
     * Finds a property of an entity class.
     * @param entity - The class.
     * @param key - The name of the property.
     * @returns The property, or undefined when the class has no decorated property of that name.
     */
    static findProperty<T>(entity: EntityClass<T>, key: string): EntityProperty<T> | undefined {
        return this.resolveProperties(entity).find(property => property.key === key);
    }

    /**
     * Resolves a condition of a property for an entity.
     * @param condition - The condition, a boolean or a function of the entity.
     * @param entity - The values of the entity, any of which may be missing.
     * @returns Whether it applies.
     */
    static resolveCondition<T>(condition: EntityCondition<T>, entity: Partial<T>): boolean {
        return typeof condition === 'boolean' ? condition : condition(entity);
    }

    /**
     * Resolves a new entity with the default of every property that has one.
     * @param entity - The class.
     * @returns The values of the new entity.
     */
    static resolveDefaults<T extends object>(entity: EntityClass<T>): Partial<T> {
        const defaults: Partial<T> = {};
        for (const property of this.resolveProperties(entity)) {
            const value: unknown = this.resolveDefault(property.metadata.default);
            if (value !== undefined) {
                Reflect.set(defaults, property.key, value);
            }
        }
        return defaults;
    }

    /**
     * Resolves the values of an entity that differ from the ones it had, like for a PATCH that only sends those.
     * Only the decorated properties count, by isEqual. A changed object or array is sent whole.
     * @param entity - The class.
     * @param original - The entity as it was.
     * @param current - The entity as it is now.
     * @returns The changed values, empty when nothing changed.
     */
    static resolveChanges<T extends object>(entity: EntityClass<T>, original: Partial<T>, current: Partial<T>): Partial<T> {
        const changes: Partial<T> = {};
        for (const { key } of this.resolveWritableProperties(entity)) {
            const value: unknown = Reflect.get(current, key);
            if (!this.isEqual(Reflect.get(original, key), value)) {
                Reflect.set(changes, key, value);
            }
        }
        return changes;
    }

    /**
     * Resolves the values of an entity that are sent to the server, like for a POST: the ones of the decorated
     * properties that aren't relations. Zibri takes none, it takes the joinColumn of a relation instead.
     * @param entity - The class.
     * @param values - The values.
     * @returns The values that are sent.
     */
    static resolveWritableValues<T extends object>(entity: EntityClass<T>, values: Partial<T>): Partial<T> {
        const writable: Partial<T> = {};
        for (const { key } of this.resolveWritableProperties(entity)) {
            if (Reflect.has(values, key)) {
                Reflect.set(writable, key, Reflect.get(values, key));
            }
        }
        return writable;
    }

    /**
     * Gets the key of the value of a property in a form: the joinColumn of a relation to one entity, which keeps its
     * id, else the key of the property.
     * @param property - The property.
     * @returns The key.
     */
    static getValueKey<T>(property: EntityProperty<T>): string {
        return this.isToOneRelation(property.metadata) ? property.metadata.joinColumn : property.key;
    }

    /**
     * Gets a value of an entity by its path, like 'address.city' for a property of an object property.
     * @param values - The values of the entity.
     * @param path - The keys, separated by dots.
     * @returns The value, or undefined when a part of the path is missing.
     */
    static getValueAtPath(values: object, path: string): unknown {
        let value: unknown = values;
        for (const key of path.split('.')) {
            if (typeof value !== 'object' || value == undefined) {
                return undefined;
            }
            value = Reflect.get(value, key);
        }
        return value;
    }

    /**
     * Resolves a copy of the values of an entity with one value changed by its path, like 'address.city', copying the
     * objects on the way and creating the missing ones.
     * @param values - The values of the entity, which stay as they are.
     * @param path - The keys, separated by dots.
     * @param value - The new value.
     * @returns The changed copy.
     */
    static resolveWithValueAtPath<T extends object>(values: T, path: string, value: unknown): T {
        const [key, ...rest] = path.split('.');
        const result: T = { ...values };
        if (key == undefined) {
            return result;
        }
        if (rest.length === 0) {
            Reflect.set(result, key, value);
            return result;
        }
        const nested: unknown = Reflect.get(values, key);
        const parent: object = typeof nested === 'object' && nested != undefined ? nested : {};
        Reflect.set(result, key, this.resolveWithValueAtPath(parent, rest.join('.'), value));
        return result;
    }

    /**
     * Whether two values are the same: dates by their time, arrays by their items and plain objects by their values,
     * in any order of their keys, everything else by identity.
     * @param a - The one value.
     * @param b - The other value.
     * @returns True when they are equal.
     */
    static isEqual(a: unknown, b: unknown): boolean {
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && a.every((item: unknown, index) => this.isEqual(item, b[index]));
        }
        if (this.isPlainObject(a) && this.isPlainObject(b)) {
            const keys: Set<string> = new Set([...Object.keys(a), ...Object.keys(b)]);
            return [...keys].every(key => this.isEqual(Reflect.get(a, key), Reflect.get(b, key)));
        }
        return a === b;
    }

    /**
     * Whether a value holds nothing the user entered: undefined, null, an empty text, false, an empty array, or a plain
     * object whose values are all empty, like an address none of whose fields was filled in.
     * @param value - The value.
     * @returns True when it is empty.
     */
    // false is what a checkbox the user unchecked again holds, which is no more entered than one never touched.
    static isEmpty(value: unknown): boolean {
        if (value == undefined || value === '' || value === false) {
            return true;
        }
        const children: unknown[] | undefined = this.isPlainObject(value) ? Object.values(value) : undefined;
        return Array.isArray(value) ? value.length === 0 : children?.every(child => this.isEmpty(child)) ?? false;
    }

    /**
     * Resolves a copy of the values of an entity without the inline objects that aren't required and are empty, also
     * inside other objects, so they are sent as missing rather than as an object without its required values.
     * @param entity - The class.
     * @param values - The values.
     * @returns The copy.
     */
    static resolveWithoutEmptyObjects<T extends object>(entity: EntityClass<T>, values: Partial<T>): Partial<T> {
        const result: Partial<T> = { ...values };
        for (const { key, metadata } of this.resolveProperties(entity)) {
            const value: unknown = Reflect.get(values, key);
            if (metadata.type !== 'object' || metadata.displayStyle !== 'inline' || typeof value !== 'object' || value == undefined) {
                continue;
            }
            if (!this.resolveCondition(metadata.required, values) && this.isEmpty(value)) {
                Reflect.deleteProperty(result, key);
            }
            else {
                Reflect.set(result, key, this.resolveWithoutEmptyObjects(metadata.cls(), value));
            }
        }
        return result;
    }

    /**
     * Whether a property is a relation to one other entity, which keeps the id of it in a joinColumn.
     * @param metadata - What the property says about itself.
     * @returns True for a manyToOne or belongsToOne.
     */
    static isToOneRelation<T>(metadata: PropertyMetadata<T>): metadata is ToOnePropertyMetadata<T> {
        return metadata.type === 'manyToOne' || metadata.type === 'belongsToOne';
    }

    /**
     * Resolves the text that names the other entity of a relation: the value of its label property.
     * @param metadata - What the relation says about itself.
     * @param related - The other entity.
     * @returns The text, empty when its label is no text or number.
     */
    static resolveRelationLabel<T>(metadata: ToOnePropertyMetadata<T>, related: object): string {
        const label: unknown = Reflect.get(related, metadata.label);
        return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
    }

    /**
     * Resolves an entity from its json, like the answer of a server: json has no dates, so the date properties hold
     * strings, which become dates, also in the entities of its relations, its objects and the items of its arrays. A
     * password is left out.
     * @param entity - The class.
     * @param json - The entity as json gives it.
     * @returns A copy with the dates, without passwords.
     */
    static resolveFromJson<T extends object>(entity: EntityClass<T>, json: T): T {
        const result: T = { ...json };
        for (const { key, metadata } of this.resolveProperties(entity)) {
            const value: unknown = Reflect.get(json, key);
            if (metadata.type === 'date' && typeof value === 'string') {
                Reflect.set(result, key, new Date(value));
            }
            // a server that sends a password sends its hash, which no form or table should show or send back.
            else if (metadata.type === 'string' && metadata.password) {
                Reflect.deleteProperty(result, key);
            }
            else if (this.isToOneRelation(metadata) && typeof value === 'object' && value != undefined) {
                Reflect.set(result, key, this.resolveFromJson(metadata.target(), value));
            }
            else if (metadata.type === 'object' && typeof value === 'object' && value != undefined) {
                Reflect.set(result, key, this.resolveFromJson(metadata.cls(), value));
            }
            else if (metadata.type === 'dateRange') {
                Reflect.set(result, key, this.resolveRangeFromJson(value));
            }
            else if (metadata.type === 'array' && Array.isArray(value)) {
                Reflect.set(result, key, value.map((item: unknown) => this.resolveItemFromJson(metadata.items, item)));
            }
            else if (metadata.type === 'oneToMany' && Array.isArray(value)) {
                Reflect.set(result, key, value.map((item: unknown) => this.resolveRelatedFromJson(metadata.target(), item)));
            }
        }
        return result;
    }

    /**
     * Resolves the members of an enum, with the text that names each: the value of a string enum, the name of the
     * member of a number enum.
     * @param values - The enum.
     * @returns Its members, in order.
     */
    // a number enum maps its values back to the names of its members as well, which are no members.
    static resolveEnumMembers(values: Record<string, string | number>): EnumMember[] {
        const entries: [string, string | number][] = Object.entries(values);
        const numbers: [string, string | number][] = entries.filter(([, value]) => typeof value === 'number');
        return numbers.length > 0
            ? numbers.map(([name, value]) => ({ label: name, value }))
            : entries.map(([, value]) => ({ label: String(value), value }));
    }

    // relations are read, never written: zibri answers a body that carries one with a 400.
    private static resolveWritableProperties<T>(entity: EntityClass<T>): EntityProperty<T>[] {
        return this.resolveProperties(entity).filter(({ metadata }) => {
            return !this.isToOneRelation(metadata) && metadata.type !== 'oneToMany';
        });
    }

    // the dates of an item, also those of a range and inside an object.
    private static resolveItemFromJson<T>(items: ArrayItemMetadata<T>, item: unknown): unknown {
        switch (items.type) {
            case 'date': {
                return typeof item === 'string' ? new Date(item) : item;
            }
            case 'dateRange': {
                return this.resolveRangeFromJson(item);
            }
            case 'object': {
                return this.resolveRelatedFromJson(items.cls(), item);
            }
            case 'string':
            case 'number': {
                return item;
            }
        }
    }

    // the start and the end of a range, which json has as strings.
    private static resolveRangeFromJson(range: unknown): unknown {
        if (typeof range !== 'object' || range == undefined) {
            return range;
        }
        const start: unknown = Reflect.get(range, 'start');
        const end: unknown = Reflect.get(range, 'end');
        return {
            ...range,
            start: typeof start === 'string' ? new Date(start) : start,
            end: typeof end === 'string' ? new Date(end) : end
        };
    }

    // an item of a json array is unknown, and only an object is an entity.
    private static resolveRelatedFromJson(entity: EntityClass<object>, item: unknown): unknown {
        return typeof item === 'object' && item != undefined ? this.resolveFromJson(entity, item) : item;
    }

    // by the defaults the kinds of properties have, so a function is always one that creates the value.
    private static resolveDefault(value: PropertyMetadata<unknown>['default']): unknown {
        // a custom property may hold any value, so its default is narrowed to a Function, not to what creates it.
        return typeof value === 'function' ? Reflect.apply(value, undefined, []) : value;
    }

    // dates, arrays and class instances aren't compared by their keys.
    private static isPlainObject(value: unknown): value is object {
        return typeof value === 'object' && value != undefined && Object.getPrototypeOf(value) === Object.prototype;
    }
}