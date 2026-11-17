import { ArrayItemMetadata } from './array-property-metadata.model';
import { DateDisplayStyle } from './date-property-metadata.model';
import { EntityClass } from './entity-class.type';
import { EntityTextLabels } from './entity-text-labels.model';
import { EntityUtilities } from './entity.utilities';
import { ObjectOption } from './object-option.model';
import { ObjectPropertyMetadata } from './object-property-metadata.model';
import { PropertyMetadata } from './property-metadata.type';

/**
 * Turns the values of entities into the texts that show them, like in a table.
 */
export abstract class EntityTextUtilities {
    /**
     * Resolves the text of a value of a property: a number and a date in the locale, a boolean as yes or no, the
     * member of an enum by its name, the other entity of a relation by its label, an object of a select by the label
     * of its option, an inline object by the texts of its values, a date range by its start and end, and an array by
     * the texts of its items. A custom property shows a text as it is, anything else as nothing.
     * @param metadata - What the property says about itself.
     * @param value - The value.
     * @param entity - The entity the value is of, which the options of a select may depend on.
     * @param labels - The texts of booleans.
     * @param locale - The locale numbers and dates are formatted in.
     * @returns The text, empty for no value.
     */
    static resolveText<T>(
        metadata: PropertyMetadata<T>,
        value: unknown,
        entity: Partial<T>,
        labels: EntityTextLabels,
        locale: string
    ): string {
        // a relation shows the label of the other entity, when the read included it.
        if (EntityUtilities.isToOneRelation(metadata)) {
            return typeof value === 'object' && value != undefined ? EntityUtilities.resolveRelationLabel(metadata, value) : '';
        }
        if (metadata.type === 'object') {
            return typeof value === 'object' && value != undefined ? this.resolveObjectText(metadata, value, entity, labels, locale) : '';
        }
        if (metadata.type === 'dateRange') {
            return this.resolveRangeText(value, metadata.displayStyle, locale);
        }
        if (metadata.type === 'array') {
            const items: unknown[] = Array.isArray(value) ? value : [];
            return items.map(item => this.resolveItemText(metadata.items, item, labels, locale)).filter(text => text !== '')
                .join(', ');
        }
        // a value of another type than its property says, like one a custom route answers, shows nothing.
        return this.isPropertyValue(value) ? this.resolveValueText(metadata, value, labels, locale) : '';
    }

    /**
     * Resolves the text of an item of an array: a string, a number in the locale, the member of an enum by its name, a
     * date or a date range in the locale, an object by the texts of its values.
     * @param items - What the items of the array say about themselves.
     * @param item - The item.
     * @param labels - The texts of booleans inside an object.
     * @param locale - The locale numbers and dates are formatted in.
     * @returns The text, empty for an item of another type.
     */
    static resolveItemText<T>(items: ArrayItemMetadata<T>, item: unknown, labels: EntityTextLabels, locale: string): string {
        switch (items.type) {
            case 'string':
            case 'number': {
                return this.resolveChipText(items.enum, item, locale);
            }
            case 'date': {
                return item instanceof Date ? this.resolveDateText(item, items.displayStyle, locale) : '';
            }
            case 'dateRange': {
                return this.resolveRangeText(item, items.displayStyle, locale);
            }
            case 'object': {
                return typeof item === 'object' && item != undefined ? this.resolveValuesText(items.cls(), item, labels, locale) : '';
            }
        }
    }

    /**
     * Resolves the text of a date in a locale: the day, and its time for a datetime.
     * @param date - The date.
     * @param displayStyle - Whether it is a day, or a day and a time of it.
     * @param locale - The locale.
     * @returns The text.
     */
    static resolveDateText(date: Date, displayStyle: DateDisplayStyle, locale: string): string {
        const time: Intl.DateTimeFormatOptions = displayStyle === 'datetime' ? { timeStyle: 'short' } : {};
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...time }).format(date);
    }

    // a string, a number in the locale, or the member of an enum by its name.
    private static resolveChipText(values: Record<string, string | number> | undefined, item: unknown, locale: string): string {
        if (values != undefined) {
            return EntityUtilities.resolveEnumMembers(values).find(member => member.value === item)?.label ?? String(item);
        }
        if (typeof item === 'number') {
            return new Intl.NumberFormat(locale).format(item);
        }
        return typeof item === 'string' ? item : '';
    }

    // the start and the end, with a dash between them.
    private static resolveRangeText(item: unknown, displayStyle: DateDisplayStyle, locale: string): string {
        if (typeof item !== 'object' || item == undefined) {
            return '';
        }
        const [start, end] = [Reflect.get(item, 'start'), Reflect.get(item, 'end')].map((date: unknown) => {
            return date instanceof Date ? this.resolveDateText(date, displayStyle, locale) : undefined;
        });
        return start == undefined || end == undefined ? '' : `${start} – ${end}`;
    }

    // the label of the option, or the texts of the shown properties.
    private static resolveObjectText<T>(
        metadata: ObjectPropertyMetadata<T>,
        value: object,
        entity: Partial<T>,
        labels: EntityTextLabels,
        locale: string
    ): string {
        if (metadata.options == undefined) {
            return this.resolveValuesText(metadata.cls(), value, labels, locale);
        }
        const options: ObjectOption<object>[] = typeof metadata.options === 'function' ? metadata.options(entity) : metadata.options;
        return options.find(option => EntityUtilities.isEqual(option.value, value))?.label ?? '';
    }

    // the texts of the properties of an object that show, which may be empty, joined.
    private static resolveValuesText(cls: EntityClass<object>, value: object, labels: EntityTextLabels, locale: string): string {
        return EntityUtilities.resolveProperties(cls)
            .filter(property => EntityUtilities.resolveCondition(property.metadata.display, value))
            .map(property => this.resolveText(property.metadata, Reflect.get(value, property.key), value, labels, locale))
            .filter(text => text !== '')
            .join(', ');
    }

    // whether a value is of a type a property that isn't a relation can have.
    private static isPropertyValue(value: unknown): value is string | number | boolean | Date {
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date;
    }

    // the text of a value of a type a property can have.
    private static resolveValueText<T>(
        metadata: PropertyMetadata<T>,
        value: string | number | boolean | Date,
        labels: EntityTextLabels,
        locale: string
    ): string {
        if ((metadata.type === 'string' || metadata.type === 'number') && metadata.enum != undefined) {
            return EntityUtilities.resolveEnumMembers(metadata.enum).find(member => member.value === value)?.label ?? String(value);
        }
        if (metadata.type === 'number' && typeof value === 'number') {
            return new Intl.NumberFormat(locale).format(value);
        }
        if (metadata.type === 'boolean') {
            return value === true ? labels.yesLabel : labels.noLabel;
        }
        if (metadata.type === 'date' && value instanceof Date) {
            return this.resolveDateText(value, metadata.displayStyle, locale);
        }
        return typeof value === 'string' ? value : '';
    }
}